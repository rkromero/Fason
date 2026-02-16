import pool from '../db'
import bcrypt from 'bcryptjs'

// ─── Migration versioning ───────────────────────────────────────

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `)
}

async function hasMigration(name: string): Promise<boolean> {
  const r = await pool.query(`SELECT 1 FROM _migrations WHERE name = $1`, [name])
  return r.rows.length > 0
}

async function markMigration(name: string) {
  await pool.query(`INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`, [name])
}

async function runMigration(name: string, fn: () => Promise<void>) {
  if (await hasMigration(name)) return
  console.log(`Ejecutando migración: ${name}`)
  await fn()
  await markMigration(name)
  console.log(`Migración completada: ${name}`)
}

// ─── Column check helper ────────────────────────────────────────

async function columnExists(table: string, column: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = $1 AND column_name = $2)`,
    [table, column]
  )
  return r.rows[0].exists
}

// ─── Main init ──────────────────────────────────────────────────

export async function initDatabase() {
  try {
    console.log('Verificando conexión a la base de datos...')
    await pool.query('SELECT 1')
    console.log('Conexión establecida')

    await ensureMigrationsTable()

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

    await runMigration('users_add_password_hash', async () => {
      if (!(await columnExists('users', 'password_hash'))) {
        await pool.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)`)
      }
    })
    console.log('Tabla users verificada')

    // ─── Tabla leads ─────────────────────────────────────────
    const checkLeads = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads')`
    )

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
          monto_estimado NUMERIC(15,2),
          stage VARCHAR(50) NOT NULL DEFAULT 'entrante' CHECK (stage IN ('entrante', 'primer-llamado', 'seguimiento', 'negociacion', 'ganado', 'perdido')),
          owner_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          status VARCHAR(20) DEFAULT 'active',
          converted_at TIMESTAMP WITH TIME ZONE,
          account_id VARCHAR(255),
          contact_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          notes JSONB DEFAULT '[]'::jsonb,
          last_contact TIMESTAMP WITH TIME ZONE
        )
      `)
    } else {
      await runMigration('leads_add_owner_id', async () => {
        if (!(await columnExists('leads', 'owner_id'))) {
          await pool.query(`ALTER TABLE leads ADD COLUMN owner_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL`)
        }
      })
      await runMigration('leads_add_status', async () => {
        if (!(await columnExists('leads', 'status'))) {
          await pool.query(`ALTER TABLE leads ADD COLUMN status VARCHAR(20) DEFAULT 'active'`)
        }
      })
      await runMigration('leads_add_converted_at', async () => {
        if (!(await columnExists('leads', 'converted_at'))) {
          await pool.query(`ALTER TABLE leads ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE`)
        }
      })
      await runMigration('leads_add_account_id', async () => {
        if (!(await columnExists('leads', 'account_id'))) {
          await pool.query(`ALTER TABLE leads ADD COLUMN account_id VARCHAR(255)`)
        }
      })
      await runMigration('leads_add_contact_id', async () => {
        if (!(await columnExists('leads', 'contact_id'))) {
          await pool.query(`ALTER TABLE leads ADD COLUMN contact_id VARCHAR(255)`)
        }
      })
      await runMigration('leads_add_monto_estimado', async () => {
        if (!(await columnExists('leads', 'monto_estimado'))) {
          await pool.query(`ALTER TABLE leads ADD COLUMN monto_estimado NUMERIC(15,2)`)
          await pool.query(`
            UPDATE leads SET monto_estimado = CAST(
              NULLIF(REGEXP_REPLACE(inversion_estimada, '[^0-9.]', '', 'g'), '')
            AS NUMERIC)
            WHERE inversion_estimada IS NOT NULL AND monto_estimado IS NULL
          `)
        }
      })
    }

    // Lead indexes
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
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_monto ON leads(monto_estimado DESC NULLS LAST)`)
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

    await runMigration('accounts_add_cuit', async () => {
      if (!(await columnExists('accounts', 'cuit'))) {
        await pool.query(`ALTER TABLE accounts ADD COLUMN cuit VARCHAR(20)`)
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_accounts_cuit ON accounts(cuit)`)
      }
    })
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
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_contacts_telefono ON contacts(telefono)`)
    console.log('Tabla contacts verificada')

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
