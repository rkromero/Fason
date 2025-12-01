import pool from '../db'
import fs from 'fs'
import path from 'path'

/**
 * Script para inicializar la base de datos
 * Ejecuta el esquema SQL si la tabla no existe
 */
export async function initDatabase() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...')
    
    // Verificar conexión primero
    await pool.query('SELECT 1')
    console.log('✅ Conexión a la base de datos establecida')
    
    // Verificar si la tabla ya existe
    console.log('🔍 Verificando si la tabla leads existe...')
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leads'
      );
    `)
    
    if (checkTable.rows[0].exists) {
      console.log('✅ La tabla leads ya existe')
      return { exists: true }
    }
    
    console.log('📝 La tabla no existe, creándola...')
    
    // Leer y ejecutar el esquema SQL
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql')
    console.log('📄 Leyendo esquema desde:', schemaPath)
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`No se encontró el archivo de esquema en: ${schemaPath}`)
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    console.log('📄 Esquema leído, ejecutando...')
    
    // Ejecutar el esquema completo (PostgreSQL maneja IF NOT EXISTS)
    // Dividir por líneas y filtrar comentarios, luego unir statements válidos
    const lines = schema.split('\n')
    const statements: string[] = []
    let currentStatement = ''
    
    for (const line of lines) {
      const trimmed = line.trim()
      // Saltar comentarios y líneas vacías
      if (trimmed.startsWith('--') || trimmed === '') {
        continue
      }
      
      currentStatement += line + '\n'
      
      // Si la línea termina con ;, es el final de un statement
      if (trimmed.endsWith(';')) {
        const statement = currentStatement.trim()
        if (statement.length > 0) {
          statements.push(statement)
        }
        currentStatement = ''
      }
    }
    
    // Ejecutar cada statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log('📝 Ejecutando:', statement.substring(0, 50) + '...')
          await pool.query(statement)
        } catch (err: any) {
          // Ignorar errores de "already exists" para índices y comentarios
          if (!err.message.includes('already exists') && 
              !err.message.includes('does not exist') &&
              !err.message.includes('COMMENT ON')) {
            console.error('Error ejecutando statement:', err.message)
            throw err
          }
        }
      }
    }
    
    console.log('✅ Base de datos inicializada correctamente')
    return { exists: false, created: true }
  } catch (error: any) {
    console.error('❌ Error al inicializar la base de datos:', error)
    console.error('Stack:', error.stack)
    throw error
  }
}

