import { NextResponse } from 'next/server'
import { getLeadById } from '@/lib/db/queries'
import { createAccount, createContact, convertLead, createDeal } from '@/lib/db/account-queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized()
    const { id } = params
    const body = await request.json()

    const lead = await getLeadById(id)
    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    if (lead.status === 'converted') {
      return NextResponse.json({ error: 'Este lead ya fue convertido' }, { status: 400 })
    }

    let accountId: string

    if (body.existingAccountId) {
      accountId = body.existingAccountId
    } else {
      const account = await createAccount({
        nombre: body.accountNombre || lead.nombre,
        empresa: body.accountEmpresa || lead.empresa,
        cuit: body.accountCuit,
        email: body.accountEmail || lead.email,
        telefono: body.accountTelefono || lead.telefono,
        website: body.accountWebsite,
        industria: body.accountIndustria,
        notas: body.accountNotas,
        ownerId: lead.ownerId,
      })
      accountId = account.id
    }

    const contact = await createContact({
      nombre: body.contactNombre || lead.nombre,
      email: body.contactEmail || lead.email,
      telefono: body.contactTelefono || lead.telefono,
      cargo: body.contactCargo,
      accountId,
    })

    // Create Deal "Won"
    const dealAmount = parseFloat(body.dealAmount) || 0
    const deal = await createDeal({
      titulo: body.dealTitulo || `${lead.empresa} - Conversión`,
      monto: dealAmount,
      moneda: body.dealMoneda || 'ARS',
      status: 'won',
      accountId,
      contactId: contact.id,
      originLeadId: id,
      ownerId: lead.ownerId,
      notas: body.dealNotas,
    })

    await convertLead(id, accountId, contact.id)

    return NextResponse.json({
      success: true,
      accountId,
      contactId: contact.id,
      dealId: deal.id,
    }, { status: 200 })
  } catch (error) {
    console.error('Error al convertir lead:', error)
    return NextResponse.json({ error: 'Error al convertir el lead' }, { status: 500 })
  }
}
