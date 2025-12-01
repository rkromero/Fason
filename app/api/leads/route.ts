import { NextResponse } from 'next/server'
import { Lead } from '@/lib/types/lead'
import { getAllLeads, createLead } from '@/lib/db/queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

// GET - Obtener todos los leads
export async function GET() {
  try {
    // Asegurar que la base de datos esté inicializada
    await ensureDatabaseInitialized()
    
    const leads = await getAllLeads()
    return NextResponse.json({ leads }, { status: 200 })
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
    // Asegurar que la base de datos esté inicializada
    await ensureDatabaseInitialized()
    
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

    const newLead = await createLead({
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
      notes: [],
    })

    return NextResponse.json({ lead: newLead }, { status: 201 })
  } catch (error) {
    console.error('Error al crear lead:', error)
    return NextResponse.json(
      { error: 'Error al crear el lead' },
      { status: 500 }
    )
  }
}

