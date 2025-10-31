import { NextResponse } from 'next/server'
import { Lead } from '@/lib/types/lead'
import { leadsStore } from '@/lib/data/leads-store'

// GET - Obtener todos los leads
export async function GET() {
  try {
    return NextResponse.json({ leads: leadsStore }, { status: 200 })
  } catch (error) {
    console.error('Error al obtener leads:', error)
    return NextResponse.json(
      { error: 'Error al obtener los leads' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo lead
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nombre,
      empresa,
      email,
      telefono,
      producto,
      marca,
      volumen,
      envasado,
      mensaje,
      inversionEstimada,
    } = body

    // Validar campos requeridos
    if (!nombre || !email || !telefono || !empresa || !producto || !marca || !volumen || !envasado) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const newLead: Lead = {
      id: Date.now().toString(),
      nombre,
      empresa,
      email,
      telefono,
      producto,
      marca,
      volumen,
      envasado,
      mensaje,
      inversionEstimada,
      stage: 'entrante',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
    }

    leadsStore.push(newLead)

    return NextResponse.json({ lead: newLead }, { status: 201 })
  } catch (error) {
    console.error('Error al crear lead:', error)
    return NextResponse.json(
      { error: 'Error al crear el lead' },
      { status: 500 }
    )
  }
}

