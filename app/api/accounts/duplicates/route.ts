import { NextResponse } from 'next/server'
import { findDuplicateAccounts } from '@/lib/db/account-queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized()
    const body = await request.json()
    const { cuit, email, telefono, empresa, nombre } = body

    const duplicates = await findDuplicateAccounts({ cuit, email, telefono, empresa, nombre })
    return NextResponse.json({ duplicates }, { status: 200 })
  } catch (error) {
    console.error('Error al buscar duplicados:', error)
    return NextResponse.json({ error: 'Error al buscar duplicados' }, { status: 500 })
  }
}
