import { NextResponse } from 'next/server'
import { initDatabase } from '@/lib/db/init'

/**
 * Endpoint para inicializar la base de datos manualmente
 * GET /api/db/init
 */
export async function GET() {
  try {
    console.log('🚀 Iniciando inicialización de base de datos...')
    await initDatabase()
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Base de datos inicializada correctamente' 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Error al inicializar la base de datos:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al inicializar la base de datos',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

