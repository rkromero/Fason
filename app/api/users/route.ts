import { NextResponse } from 'next/server'
import { getAllUsers, createUser } from '@/lib/db/user-queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

// GET - Listar usuarios (cualquier usuario autenticado puede ver)
export async function GET() {
  try {
    await ensureDatabaseInitialized()
    const users = await getAllUsers()
    const res = NextResponse.json({ users }, { status: 200 })
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return res
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json({ error: 'Error al obtener los usuarios' }, { status: 500 })
  }
}

// POST - Crear usuario (solo admin)
export async function POST(request: Request) {
  try {
    // RBAC: solo admin puede crear usuarios
    const rol = request.headers.get('x-user-rol')
    if (rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden crear usuarios' }, { status: 403 })
    }

    await ensureDatabaseInitialized()
    const body = await request.json()
    const { nombre, email, telefono, rol: userRol, password } = body

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const user = await createUser({ nombre, email, telefono, rol: userRol || 'vendedor', password })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 })
  }
}
