import pool from '../db'
import bcrypt from 'bcryptjs'

/**
 * Inicializa la base de datos: crea tablas, aplica migraciones y crea admin por defecto
 */
export async function initDatabase() {
  try {
    console.log('Verificando conexión a la base de datos...')
    await pool.query('SELECT 1')
    console.log('Conexión establecida')

    // ─── Tabla users ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        telefono VARCHAR(50),
        password_hash VARCHAR(255),
        rol VARCHAR(50) NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor', 'viewer')),
        activo BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_activo ON users(activo)`)

    // Migración: agregar password_hash si no existe
    const checkPwCol = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
      )
    `)
    if (!checkPwCol.rows[0].exists) {
      console.log('Agregando columna password_hash a users...')
      await pool.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)`)
    }

    console.log('Tabla users verificada')

    // ─── Tabla leads ─────────────────────────────────────────
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

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_empresa ON leads(empresa)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_status_converted ON leads(status, converted_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_producto ON leads(producto)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_account_id ON leads(account_id)`)
    console.log('Tabla leads verificada')

    // ─── Tabla accounts ─────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(255) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        empresa VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefono VARCHAR(50),
        website VARCHAR(500),
        industria VARCHAR(255),
        notas TEXT,
        owner_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_accounts_empresa ON accounts(empresa)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_accounts_owner_id ON accounts(owner_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at DESC)`)
    console.log('Tabla accounts verificada')

    // ─── Tabla contacts ──────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(255) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefono VARCHAR(50),
        cargo VARCHAR(255),
        account_id VARCHAR(255) REFERENCES accounts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON contacts(account_id)`)
    console.log('Tabla contacts verificada')

    // ─── Migración accounts: agregar cuit si no existe ────────
    const checkCuitCol = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'accounts' AND column_name = 'cuit'
      )
    `)
    if (!checkCuitCol.rows[0].exists) {
      console.log('Agregando columna cuit a accounts...')
      await pool.query(`ALTER TABLE accounts ADD COLUMN cuit VARCHAR(20)`)
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_accounts_cuit ON accounts(cuit)`)
    }

    // ─── Tabla deals ──────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id VARCHAR(255) PRIMARY KEY,
        titulo VARCHAR(500) NOT NULL,
        monto NUMERIC(15,2) NOT NULL DEFAULT 0,
        moneda VARCHAR(10) NOT NULL DEFAULT 'ARS',
        status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('won', 'lost', 'open')),
        account_id VARCHAR(255) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE SET NULL,
        origin_lead_id VARCHAR(255) REFERENCES leads(id) ON DELETE SET NULL,
        owner_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        closed_at TIMESTAMP WITH TIME ZONE,
        notas TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_deals_account_id ON deals(account_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_deals_origin_lead ON deals(origin_lead_id)`)
    console.log('Tabla deals verificada')

    // ─── Migración leads: columnas de conversión ─────────────
    const checkStatusCol = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'status'
      )
    `)
    if (!checkStatusCol.rows[0].exists) {
      console.log('Agregando columna status a leads...')
      await pool.query(`ALTER TABLE leads ADD COLUMN status VARCHAR(20) DEFAULT 'active'`)
    }
    const checkConvertedAtCol = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'converted_at'
      )
    `)
    if (!checkConvertedAtCol.rows[0].exists) {
      console.log('Agregando columna converted_at a leads...')
      await pool.query(`ALTER TABLE leads ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE`)
    }
    const checkAccountIdCol = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'account_id'
      )
    `)
    if (!checkAccountIdCol.rows[0].exists) {
      console.log('Agregando columna account_id a leads...')
      await pool.query(`ALTER TABLE leads ADD COLUMN account_id VARCHAR(255) REFERENCES accounts(id) ON DELETE SET NULL`)
    }
    const checkContactIdCol = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'contact_id'
      )
    `)
    if (!checkContactIdCol.rows[0].exists) {
      console.log('Agregando columna contact_id a leads...')
      await pool.query(`ALTER TABLE leads ADD COLUMN contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE SET NULL`)
    }

    // ─── Admin por defecto ───────────────────────────────────
    const adminEmail = 'rodolfor86@gmail.com'
    const checkAdmin = await pool.query(`SELECT id, password_hash FROM users WHERE email = $1`, [adminEmail])

    if (checkAdmin.rows.length === 0) {
      console.log('Creando usuario administrador por defecto...')
      const hash = await bcrypt.hash('Mon$$123', 12)
      await pool.query(
        `INSERT INTO users (id, nombre, email, password_hash, rol, activo, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'admin', true, NOW(), NOW())`,
        ['usr-admin-1', 'Administrador', adminEmail, hash]
      )
      console.log('Admin creado')
    } else if (!checkAdmin.rows[0].password_hash) {
      console.log('Estableciendo password del admin...')
      const hash = await bcrypt.hash('Mon$$123', 12)
      await pool.query(`UPDATE users SET password_hash = $1, rol = 'admin' WHERE email = $2`, [hash, adminEmail])
      console.log('Password del admin establecido')
    }

    console.log('Base de datos inicializada correctamente')
    return { success: true }
  } catch (error: any) {
    console.error('Error al inicializar la base de datos:', error)
    throw error
  }
}
