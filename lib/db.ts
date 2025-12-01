import { Pool } from 'pg'

// Configuración de la conexión a PostgreSQL
// Railway proporciona DATABASE_URL como variable de entorno
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Manejar errores de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL:', err)
  process.exit(-1)
})

export default pool

