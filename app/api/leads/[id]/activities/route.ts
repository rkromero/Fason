import { NextResponse } from 'next/server'
import { getActivitiesByLeadId, createActivity } from '@/lib/db/activity-queries'

// GET - Obtener actividades de un lead
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const activities = await getActivitiesByLeadId(params.id)
    return NextResponse.json({ activities }, { status: 200 })
  } catch (error) {
    console.error('Error al obtener actividades:', error)
    return NextResponse.json({ error: 'Error al obtener actividades' }, { status: 500 })
  }
}

// POST - Crear actividad (nota, llamada, email, whatsapp, etc.)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rol = request.headers.get('x-user-rol')
    if (rol === 'viewer') {
      return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
    }

    const body = await request.json()
    const userId = request.headers.get('x-user-id') || undefined

    if (!body.content) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
    }

    const activity = await createActivity(params.id, {
      type: body.type || 'note',
      content: body.content,
      metadata: body.metadata,
      createdBy: userId,
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error('Error al crear actividad:', error)
    return NextResponse.json({ error: 'Error al crear actividad' }, { status: 500 })
  }
}
