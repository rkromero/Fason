/**
 * Script para inicializar la base de datos
 * Ejecutar con: npx tsx scripts/init-db.ts
 * O con: pnpm tsx scripts/init-db.ts
 */

import { initDatabase } from '../lib/db/init'

async function main() {
  console.log('🚀 Inicializando base de datos...')
  try {
    await initDatabase()
    console.log('✅ Proceso completado')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()

