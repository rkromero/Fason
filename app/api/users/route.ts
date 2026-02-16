import { NextResponse } from 'next/server'
import { getAllUsers, createUser } from '@/lib/db/user-queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

export async function GET() {
  try {
    await ensureDatabaseInitialized()
    const users = await getAllUsers()
    return NextResponse.json({ users }, { status: 200 })
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json({ error: 'Error al obtener los usuarios' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized()
    const body = await request.json()
    const { nombre, email, telefono, rol } = body

    if (!nombre || !email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 })
    }

    const user = await createUser({ nombre, email, telefono, rol: rol || 'vendedor' })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 })
  }
}
