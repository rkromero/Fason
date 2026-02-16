import pool from '../db'
import fs from 'fs'
import path from 'path'

/**
 * Script para inicializar la base de datos
 * Crea las tablas si no existen y aplica migraciones
 */
export async function initDatabase() {
  try {
    console.log('Verificando conexión a la base de datos...')
    await pool.query('SELECT 1')
    console.log('Conexión a la base de datos establecida')

    // Crear tabla users si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        telefono VARCHAR(50),
        rol VARCHAR(50) NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor', 'viewer')),
        activo BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `)
    console.log('Tabla users verificada')

    // Crear índices de users
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_activo ON users(activo)`)

    // Crear tabla leads si no existe
    const checkLeads = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'leads'
      )
    `)

    if (!checkLeads.rows[0].exists) {
      console.log('Creando tabla leads...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id VARCHAR(255) PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          empresa VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          telefono VARCHAR(50) NOT NULL,
          producto VARCHAR(50) NOT NULL CHECK (producto IN ('alfajores', 'galletitas')),
          marca VARCHAR(10) NOT NULL CHECK (marca IN ('si', 'no')),
          volumen VARCHAR(50) NOT NULL CHECK (volumen IN ('menos-1000', '1000-5000', 'mas-5000')),
          envasado VARCHAR(50) NOT NULL CHECK (envasado IN ('flowpack-personalizado', 'flowpack-cristal', 'a-granel')),
          mensaje TEXT,
          inversion_estimada VARCHAR(100),
          stage VARCHAR(50) NOT NULL DEFAULT 'entrante' CHECK (stage IN ('entrante', 'primer-llamado', 'seguimiento', 'negociacion', 'ganado', 'perdido')),
          owner_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          notes JSONB DEFAULT '[]'::jsonb,
          last_contact TIMESTAMP WITH TIME ZONE
        )
      `)
    } else {
      // Migración: agregar owner_id si no existe
      const checkOwnerCol = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'leads' AND column_name = 'owner_id'
        )
      `)
      if (!checkOwnerCol.rows[0].exists) {
        console.log('Agregando columna owner_id a leads...')
        await pool.query(`ALTER TABLE leads ADD COLUMN owner_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL`)
      }
    }
    console.log('Tabla leads verificada')

    // Crear índices de leads
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_empresa ON leads(empresa)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id)`)

    console.log('Base de datos inicializada correctamente')
    return { success: true }
  } catch (error: any) {
    console.error('Error al inicializar la base de datos:', error)
    throw error
  }
}
