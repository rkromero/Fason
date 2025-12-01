/**
 * Inicializa la base de datos automáticamente al iniciar la aplicación
 * Se ejecuta solo si la tabla no existe
 */

import { initDatabase } from './init'

let initialized = false

export async function ensureDatabaseInitialized() {
  if (initialized) return
  
  try {
    await initDatabase()
    initialized = true
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error)
    // No lanzar error para no bloquear la aplicación
    // El usuario puede inicializar manualmente si es necesario
  }
}

