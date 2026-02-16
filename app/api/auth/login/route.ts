import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { createSession, setSessionCookie } from '@/lib/auth'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    // Buscar usuario
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

    // Verificar password
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    // Crear sesión
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
