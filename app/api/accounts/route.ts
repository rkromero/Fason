import { NextResponse } from 'next/server'
import { getAllAccounts, searchAccounts, createAccount } from '@/lib/db/account-queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

export async function GET(request: Request) {
  try {
    await ensureDatabaseInitialized()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    const accounts = q ? await searchAccounts(q) : await getAllAccounts()
    return NextResponse.json({ accounts }, { status: 200 })
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
