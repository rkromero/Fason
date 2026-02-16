import { NextResponse } from 'next/server'
import { STAGES } from '@/lib/types/lead'
import { getLeadById, updateLead, deleteLead } from '@/lib/db/queries'
import { createActivity } from '@/lib/db/activity-queries'

// PUT - Actualizar un lead (admin y vendedor)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rol = request.headers.get('x-user-rol')
    if (rol === 'viewer') {
      return NextResponse.json({ error: 'No tenés permisos para editar leads' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const userId = request.headers.get('x-user-id') || undefined

    const existingLead = await getLeadById(id)
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    if (body.stage && !['entrante', 'primer-llamado', 'seguimiento', 'negociacion', 'ganado', 'perdido'].includes(body.stage)) {
      return NextResponse.json({ error: 'Stage inválido' }, { status: 400 })
    }

    const updatedLead = await updateLead(id, body)
    if (!updatedLead) {
      return NextResponse.json({ error: 'Error al actualizar el lead' }, { status: 500 })
    }

    // Auto-log activities for important changes
    try {
      if (body.stage && body.stage !== existingLead.stage) {
        const fromLabel = STAGES.find(s => s.id === existingLead.stage)?.label || existingLead.stage
        const toLabel = STAGES.find(s => s.id === body.stage)?.label || body.stage
        await createActivity(id, {
          type: 'stage-change',
          content: `Etapa cambiada: ${fromLabel} → ${toLabel}`,
          metadata: { from: existingLead.stage, to: body.stage },
          createdBy: userId,
        })
      }
      if (body.ownerId !== undefined && body.ownerId !== existingLead.ownerId) {
        await createActivity(id, {
          type: 'owner-change',
          content: `Asignación cambiada${updatedLead.owner ? `: ${updatedLead.owner}` : ': Sin asignar'}`,
          createdBy: userId,
        })
      }
    } catch { /* non-critical */ }

    return NextResponse.json({ lead: updatedLead }, { status: 200 })
  } catch (error) {
    console.error('Error al actualizar lead:', error)
    return NextResponse.json({ error: 'Error al actualizar el lead' }, { status: 500 })
  }
}

// DELETE - Eliminar un lead (solo admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rol = request.headers.get('x-user-rol')
    if (rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar leads' }, { status: 403 })
    }

    const { id } = params
    const existingLead = await getLeadById(id)
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    const deleted = await deleteLead(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Error al eliminar el lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error al eliminar lead:', error)
    return NextResponse.json({ error: 'Error al eliminar el lead' }, { status: 500 })
  }
}
