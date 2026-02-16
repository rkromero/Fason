import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { createSession, setSessionCookie } from '@/lib/auth'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit'

const ADMIN_EMAIL = 'rodolfor86@gmail.com'
const ADMIN_DEFAULT_PW = 'Mon$$123'

let adminChecked = false

async function ensureAdminPassword() {
  if (adminChecked) return
  try {
    const check = await pool.query(
      `SELECT id, password_hash FROM users WHERE email = $1`,
      [ADMIN_EMAIL]
    )

    if (check.rows.length > 0 && check.rows[0].password_hash) {
      adminChecked = true
      return
    }

    if (check.rows.length > 0 && !check.rows[0].password_hash) {
      const hash = await bcrypt.hash(ADMIN_DEFAULT_PW, 12)
      await pool.query(
        `UPDATE users SET password_hash = $1, rol = 'admin', updated_at = NOW() WHERE email = $2`,
        [hash, ADMIN_EMAIL]
      )
    } else if (check.rows.length === 0) {
      const hash = await bcrypt.hash(ADMIN_DEFAULT_PW, 12)
      await pool.query(
        `INSERT INTO users (id, nombre, email, password_hash, rol, activo, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'admin', true, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        ['usr-admin-1', 'Administrador', ADMIN_EMAIL, hash]
      )
    }
    adminChecked = true
  } catch (err) {
    console.error('Error asegurando admin password:', err)
  }
}

export async function POST(request: Request) {
  try {
    // Rate limiting: máximo 5 intentos por IP cada 15 minutos
    const ip = getClientIp(request)
    const rl = checkRateLimit(`login:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 5 })
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfterMs)
    }

    await ensureDatabaseInitialized()
    await ensureAdminPassword()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    const result = await pool.query(
      `SELECT id, nombre, email, password_hash, rol, activo FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const user = result.rows[0]

    if (!user.activo) {
      return NextResponse.json({ error: 'Tu cuenta está desactivada. Contactá al administrador.' }, { status: 403 })
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: 'Tu cuenta no tiene contraseña configurada. Contactá al administrador.' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const token = await createSession({
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    })

    setSessionCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    })
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
