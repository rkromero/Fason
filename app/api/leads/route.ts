import { NextResponse } from 'next/server'
import { Lead } from '@/lib/types/lead'
import { getFilteredLeads, getConvertedLeads, createLead } from '@/lib/db/queries'
import { ensureDatabaseInitialized } from '@/lib/db/init-on-startup'

// GET - Obtener leads con filtros server-side
export async function GET(request: Request) {
  try {
    await ensureDatabaseInitialized()
    const { searchParams } = new URL(request.url)

    // Converted leads (separate query)
    if (searchParams.get('converted') === 'true') {
      const page = parseInt(searchParams.get('page') || '1', 10)
      const limit = parseInt(searchParams.get('limit') || '50', 10)
      const result = await getConvertedLeads(page, limit)
      return NextResponse.json(result, { status: 200 })
    }

    // Active leads with filters
    const result = await getFilteredLeads({
      search: searchParams.get('search') || undefined,
      producto: searchParams.get('producto') || undefined,
      owner: searchParams.get('owner') || undefined,
      stage: searchParams.get('stage') || undefined,
      createdToday: searchParams.get('createdToday') === 'true',
      sortBy: (searchParams.get('sortBy') as 'updated' | 'created' | 'monto') || undefined,
      sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '200', 10),
    })

    return NextResponse.json(result, { status: 200 })
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
    await ensureDatabaseInitialized()

    const body = await request.json()
    const { nombre, empresa, email, telefono, producto, marca, volumen, envasado, mensaje, inversionEstimada } = body

    if (!nombre || !email || !telefono || !empresa || !producto || !marca || !volumen || !envasado) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const newLead = await createLead({
      nombre, empresa, email, telefono, producto, marca, volumen, envasado,
      mensaje, inversionEstimada, stage: 'entrante', notes: [],
    })

    return NextResponse.json({ lead: newLead }, { status: 201 })
  } catch (error) {
    console.error('Error al crear lead:', error)
    return NextResponse.json({ error: 'Error al crear el lead' }, { status: 500 })
  }
}
