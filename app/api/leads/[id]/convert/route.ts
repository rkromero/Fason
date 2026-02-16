import { NextResponse } from 'next/server'
import { getLeadById } from '@/lib/db/queries'
import { convertLeadTransaction } from '@/lib/db/account-queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

// POST - Convertir lead (admin y vendedor)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rol = request.headers.get('x-user-rol')
    if (rol === 'viewer') {
      return NextResponse.json({ error: 'No tenés permisos para convertir leads' }, { status: 403 })
    }

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

    // Toda la conversión dentro de una transacción
    const result = await convertLeadTransaction({
      leadId: id,
      existingAccountId: body.existingAccountId || undefined,
      accountData: body.existingAccountId ? undefined : {
        nombre: body.accountNombre || lead.nombre,
        empresa: body.accountEmpresa || lead.empresa,
        cuit: body.accountCuit,
        email: body.accountEmail || lead.email,
        telefono: body.accountTelefono || lead.telefono,
        website: body.accountWebsite,
        industria: body.accountIndustria,
        notas: body.accountNotas,
        ownerId: lead.ownerId,
      },
      contactData: {
        nombre: body.contactNombre || lead.nombre,
        email: body.contactEmail || lead.email,
        telefono: body.contactTelefono || lead.telefono,
        cargo: body.contactCargo,
      },
      dealData: {
        titulo: body.dealTitulo || `${lead.empresa} - Conversión`,
        monto: parseFloat(body.dealAmount) || 0,
        moneda: body.dealMoneda || 'ARS',
        notas: body.dealNotas,
      },
      leadOwnerId: lead.ownerId,
    })

    return NextResponse.json({
      success: true,
      accountId: result.accountId,
      contactId: result.contactId,
      dealId: result.dealId,
    }, { status: 200 })
  } catch (error) {
    console.error('Error al convertir lead:', error)
    return NextResponse.json({ error: 'Error al convertir el lead' }, { status: 500 })
  }
}
