import { NextResponse } from 'next/server'
import { getUserById, updateUser, deleteUser } from '@/lib/db/user-queries'

// PUT - Actualizar usuario (solo admin)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rol = request.headers.get('x-user-rol')
    if (rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden editar usuarios' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()

    const existing = await getUserById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (body.password && body.password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const updated = await updateUser(id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Error al actualizar el usuario' }, { status: 500 })
    }

    return NextResponse.json({ user: updated }, { status: 200 })
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al actualizar el usuario' }, { status: 500 })
  }
}

// DELETE - Eliminar usuario (solo admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rol = request.headers.get('x-user-rol')
    if (rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar usuarios' }, { status: 403 })
    }

    const { id } = params
    const userId = request.headers.get('x-user-id')

    // No permitir eliminarse a sí mismo
    if (userId === id) {
      return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 })
    }

    const existing = await getUserById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const deleted = await deleteUser(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Error al eliminar el usuario' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json({ error: 'Error al eliminar el usuario' }, { status: 500 })
  }
}
