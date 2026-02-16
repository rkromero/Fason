import { NextResponse } from 'next/server'
import { initDatabase } from '@/lib/db/init'

// POST - Inicializar DB (solo admin, protegido por middleware)
export async function POST() {
  try {
    console.log('Iniciando inicialización de base de datos...')
    await initDatabase()

    return NextResponse.json(
      { success: true, message: 'Base de datos inicializada correctamente' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error al inicializar la base de datos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al inicializar la base de datos' },
      { status: 500 }
    )
  }
}

// GET removido - ya no se puede inicializar con un simple GET
