import { NextResponse } from 'next/server'
import {
  getAccountById, updateAccount, getContactsByAccountId,
  getDealsByAccountId, getConvertedLeadsByAccountId, createContact, createDeal,
} from '@/lib/db/account-queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

// GET - Obtener cuenta con contactos, deals y leads convertidos
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

// PUT - Actualizar cuenta (admin y vendedor)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rol = request.headers.get('x-user-rol')
    if (rol === 'viewer') {
      return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()

    const existing = await getAccountById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    }

    const updated = await updateAccount(id, body)
    return NextResponse.json({ account: updated }, { status: 200 })
  } catch (error) {
    console.error('Error al actualizar cuenta:', error)
    return NextResponse.json({ error: 'Error al actualizar cuenta' }, { status: 500 })
  }
}

// POST - Agregar contacto o deal a esta cuenta
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rol = request.headers.get('x-user-rol')
    if (rol === 'viewer') {
      return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()

    const account = await getAccountById(id)
    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    }

    // Add contact
    if (body.action === 'add-contact') {
      if (!body.nombre) {
        return NextResponse.json({ error: 'Nombre del contacto es requerido' }, { status: 400 })
      }
      const contact = await createContact({
        nombre: body.nombre,
        email: body.email,
        telefono: body.telefono,
        cargo: body.cargo,
        accountId: id,
      })
      return NextResponse.json({ contact }, { status: 201 })
    }

    // Add deal
    if (body.action === 'add-deal') {
      if (!body.titulo) {
        return NextResponse.json({ error: 'Título del deal es requerido' }, { status: 400 })
      }
      const ownerId = request.headers.get('x-user-id') || undefined
      const deal = await createDeal({
        titulo: body.titulo,
        monto: parseFloat(body.monto) || 0,
        moneda: body.moneda || 'ARS',
        status: body.status || 'open',
        accountId: id,
        contactId: body.contactId,
        ownerId,
        notas: body.notas,
      })
      return NextResponse.json({ deal }, { status: 201 })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Error en POST cuenta:', error)
    return NextResponse.json({ error: 'Error al procesar la acción' }, { status: 500 })
  }
}
