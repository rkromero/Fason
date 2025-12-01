import pool from '../db'
import fs from 'fs'
import path from 'path'

/**
 * Script para inicializar la base de datos
 * Ejecuta el esquema SQL si la tabla no existe
 */
export async function initDatabase() {
  try {
    // Verificar si la tabla ya existe
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leads'
      );
    `)
    
    if (checkTable.rows[0].exists) {
      console.log('✅ La tabla leads ya existe')
      return
    }
    
    // Leer y ejecutar el esquema SQL
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    
    await pool.query(schema)
    console.log('✅ Base de datos inicializada correctamente')
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error)
    throw error
  }
}

