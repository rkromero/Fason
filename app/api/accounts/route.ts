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
      return NextResponse.json({ accounts }, { status: 200 })
    }

    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const result = await getAllAccounts(page, limit)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error al obtener cuentas:', error)
    return NextResponse.json({ error: 'Error al obtener cuentas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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
