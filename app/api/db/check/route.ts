import { NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET - Verificar estado de DB (protegido por middleware, admin-only)
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const connectionTest = await pool.query('SELECT NOW()')

    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leads'
      );
    `)

    const tableExists = tableCheck.rows[0].exists

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
    console.error('Error al verificar la base de datos:', error)
    return NextResponse.json({
      connected: false,
      error: 'Error al conectar con la base de datos',
    }, { status: 500 })
  }
}
