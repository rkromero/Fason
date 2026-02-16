import { NextResponse } from 'next/server'
import { getAccountById, getContactsByAccountId, getDealsByAccountId, getConvertedLeadsByAccountId } from '@/lib/db/account-queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized()
    const { id } = params

    const account = await getAccountById(id)
    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    }

    const [contacts, deals, convertedLeads] = await Promise.all([
      getContactsByAccountId(id),
      getDealsByAccountId(id),
      getConvertedLeadsByAccountId(id),
    ])

    return NextResponse.json({ account, contacts, deals, convertedLeads }, { status: 200 })
  } catch (error) {
    console.error('Error al obtener cuenta:', error)
    return NextResponse.json({ error: 'Error al obtener cuenta' }, { status: 500 })
  }
}
