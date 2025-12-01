import { NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * Endpoint para verificar el estado de la base de datos
 * GET /api/db/check
 */
export async function GET() {
  try {
    // Verificar conexión
    const connectionTest = await pool.query('SELECT NOW()')
    
    // Verificar si existe la tabla
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leads'
      );
    `)
    
    const tableExists = tableCheck.rows[0].exists
    
    // Si la tabla existe, contar los leads
    let leadCount = 0
    if (tableExists) {
      const countResult = await pool.query('SELECT COUNT(*) FROM leads')
      leadCount = parseInt(countResult.rows[0].count)
    }
    
    return NextResponse.json({
      connected: true,
      tableExists,
      leadCount,
      timestamp: connectionTest.rows[0].now,
    }, { status: 200 })
  } catch (error: any) {
    console.error('❌ Error al verificar la base de datos:', error)
    
    return NextResponse.json({
      connected: false,
      error: error.message || 'Error al conectar con la base de datos',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

