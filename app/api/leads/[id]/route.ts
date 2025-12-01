import { NextResponse } from 'next/server'
import { LeadStage } from '@/lib/types/lead'
import { getLeadById, updateLead, deleteLead } from '@/lib/db/queries'

// PUT - Actualizar un lead
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Verificar que el lead existe
    const existingLead = await getLeadById(id)
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    // Validar que el stage sea válido si viene en el body
    if (body.stage && !['entrante', 'primer-llamado', 'seguimiento', 'negociacion', 'ganado', 'perdido'].includes(body.stage)) {
      return NextResponse.json(
        { error: 'Stage inválido' },
        { status: 400 }
      )
    }

    // Actualizar el lead
    const updatedLead = await updateLead(id, body)
    
    if (!updatedLead) {
      return NextResponse.json(
        { error: 'Error al actualizar el lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lead: updatedLead }, { status: 200 })
  } catch (error) {
    console.error('Error al actualizar lead:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el lead' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un lead
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Verificar que el lead existe
    const existingLead = await getLeadById(id)
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    const deleted = await deleteLead(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Error al eliminar el lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error al eliminar lead:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el lead' },
      { status: 500 }
    )
  }
}

