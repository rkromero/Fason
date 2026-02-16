import { NextResponse } from 'next/server'
import { getAllAccounts, searchAccounts, createAccount } from '@/lib/db/account-queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

export async function GET(request: Request) {
  try {
    await ensureDatabaseInitialized()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (q) {
      const accounts = await searchAccounts(q)
      const res = NextResponse.json({ accounts }, { status: 200 })
      res.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
      return res
    }

    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const result = await getAllAccounts(page, limit)
    const res = NextResponse.json(result, { status: 200 })
    res.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30')
    return res
  } catch (error) {
    console.error('Error al obtener cuentas:', error)
    return NextResponse.json({ error: 'Error al obtener cuentas' }, { status: 500 })
  }
}

// POST - Crear cuenta (admin y vendedor)
export async function POST(request: Request) {
  try {
    const rol = request.headers.get('x-user-rol')
    if (rol === 'viewer') {
      return NextResponse.json({ error: 'No tenés permisos para crear cuentas' }, { status: 403 })
    }

    await ensureDatabaseInitialized()
    const body = await request.json()
    const { nombre, empresa, cuit, email, telefono, website, industria, notas, ownerId } = body

    if (!nombre || !empresa) {
      return NextResponse.json({ error: 'Nombre y empresa son requeridos' }, { status: 400 })
    }

    const account = await createAccount({ nombre, empresa, cuit, email, telefono, website, industria, notas, ownerId })
    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('Error al crear cuenta:', error)
    return NextResponse.json({ error: 'Error al crear cuenta' }, { status: 500 })
  }
}
