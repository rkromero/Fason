import pool from '../db'
import { Account, Contact, Deal, DuplicateMatch } from '@/lib/types/account'

// ─── Account queries ─────────────────────────────────────────────

const ACCOUNT_SELECT = `
  a.id, a.nombre, a.empresa, a.cuit, a.email, a.telefono, a.website, a.industria, a.notas,
  a.owner_id as "ownerId", u.nombre as "ownerName",
  a.created_at as "createdAt", a.updated_at as "updatedAt"
`

function mapAccount(row: any): Account {
  return {
    id: row.id,
    nombre: row.nombre,
    empresa: row.empresa,
    cuit: row.cuit || undefined,
    email: row.email ?? '',
    telefono: row.telefono ?? '',
    website: row.website || undefined,
    industria: row.industria || undefined,
    notas: row.notas || undefined,
    ownerId: row.ownerId || undefined,
    ownerName: row.ownerName || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getAllAccounts(page = 1, limit = 100): Promise<{ accounts: Account[]; total: number }> {
  const offset = (page - 1) * limit
  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) as total FROM accounts`),
    pool.query(
      `SELECT ${ACCOUNT_SELECT} FROM accounts a LEFT JOIN users u ON a.owner_id = u.id ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
  ])
  return {
    accounts: dataRes.rows.map(mapAccount),
    total: parseInt(countRes.rows[0].total, 10),
  }
}

export async function getAccountById(id: string): Promise<Account | null> {
  const result = await pool.query(
    `SELECT ${ACCOUNT_SELECT} FROM accounts a LEFT JOIN users u ON a.owner_id = u.id WHERE a.id = $1`, [id]
  )
  return result.rows.length > 0 ? mapAccount(result.rows[0]) : null
}

export async function searchAccounts(query: string): Promise<Account[]> {
  const result = await pool.query(
    `SELECT ${ACCOUNT_SELECT} FROM accounts a LEFT JOIN users u ON a.owner_id = u.id
     WHERE a.empresa ILIKE $1 OR a.nombre ILIKE $1 OR a.email ILIKE $1 OR a.cuit ILIKE $1
     ORDER BY a.empresa ASC LIMIT 20`,
    [`%${query}%`]
  )
  return result.rows.map(mapAccount)
}

export async function createAccount(data: {
  nombre: string; empresa: string; cuit?: string; email?: string; telefono?: string;
  website?: string; industria?: string; notas?: string; ownerId?: string
}): Promise<Account> {
  const id = `acc-${Date.now()}`
  const now = new Date().toISOString()
  await pool.query(
    `INSERT INTO accounts (id, nombre, empresa, cuit, email, telefono, website, industria, notas, owner_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
    [id, data.nombre, data.empresa, data.cuit || null, data.email || null, data.telefono || null,
     data.website || null, data.industria || null, data.notas || null, data.ownerId || null, now]
  )
  return {
    id, nombre: data.nombre, empresa: data.empresa, cuit: data.cuit,
    email: data.email || '', telefono: data.telefono || '',
    website: data.website, industria: data.industria, notas: data.notas,
    ownerId: data.ownerId, createdAt: now, updatedAt: now,
  }
}

// ─── Duplicate detection (optimized: single UNION ALL query) ─────

export async function findDuplicateAccounts(data: {
  cuit?: string; email?: string; telefono?: string; empresa?: string; nombre?: string
}): Promise<DuplicateMatch[]> {
  const unions: string[] = []
  const params: any[] = []
  let idx = 1

  if (data.cuit && data.cuit.trim()) {
    const normalized = data.cuit.replace(/[-.\s]/g, '')
    unions.push(`SELECT ${ACCOUNT_SELECT}, 'cuit' as match_type, 'high' as confidence FROM accounts a LEFT JOIN users u ON a.owner_id = u.id WHERE REPLACE(REPLACE(REPLACE(a.cuit, '-', ''), '.', ''), ' ', '') = $${idx}`)
    params.push(normalized)
    idx++
  }

  if (data.email && data.email.trim()) {
    unions.push(`SELECT ${ACCOUNT_SELECT}, 'email' as match_type, 'high' as confidence FROM accounts a LEFT JOIN users u ON a.owner_id = u.id WHERE LOWER(a.email) = LOWER($${idx})`)
    params.push(data.email.trim())
    idx++
  }

  if (data.telefono && data.telefono.trim()) {
    const digits = data.telefono.replace(/\D/g, '')
    if (digits.length >= 6) {
      unions.push(`SELECT ${ACCOUNT_SELECT}, 'telefono' as match_type, 'high' as confidence FROM accounts a LEFT JOIN users u ON a.owner_id = u.id WHERE REGEXP_REPLACE(a.telefono, '[^0-9]', '', 'g') LIKE '%' || $${idx} || '%'`)
      params.push(digits)
      idx++
    }
  }

  if (data.empresa && data.empresa.trim().length >= 3) {
    const normalized = `%${data.empresa.toLowerCase().trim()}%`
    unions.push(`SELECT ${ACCOUNT_SELECT}, 'nombre' as match_type, 'medium' as confidence FROM accounts a LEFT JOIN users u ON a.owner_id = u.id WHERE LOWER(a.empresa) LIKE $${idx} OR LOWER(a.nombre) LIKE $${idx} LIMIT 5`)
    params.push(normalized)
    idx++
  }

  if (unions.length === 0) return []

  const result = await pool.query(unions.join(' UNION ALL '), params)

  const seenIds = new Set<string>()
  const matches: DuplicateMatch[] = []
  for (const row of result.rows) {
    if (!seenIds.has(row.id)) {
      seenIds.add(row.id)
      matches.push({
        account: mapAccount(row),
        matchType: row.match_type,
        confidence: row.confidence,
      })
    }
  }
  return matches
}

// ─── Contact queries ─────────────────────────────────────────────

function mapContact(row: any): Contact {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email ?? '',
    telefono: row.telefono ?? '',
    cargo: row.cargo || undefined,
    accountId: row.accountId,
    accountName: row.accountName || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getContactsByAccountId(accountId: string): Promise<Contact[]> {
  const result = await pool.query(
    `SELECT c.id, c.nombre, c.email, c.telefono, c.cargo,
       c.account_id as "accountId", a.empresa as "accountName",
       c.created_at as "createdAt", c.updated_at as "updatedAt"
     FROM contacts c LEFT JOIN accounts a ON c.account_id = a.id
     WHERE c.account_id = $1 ORDER BY c.created_at DESC`,
    [accountId]
  )
  return result.rows.map(mapContact)
}

export async function createContact(data: {
  nombre: string; email?: string; telefono?: string; cargo?: string; accountId: string
}): Promise<{ id: string }> {
  const id = `con-${Date.now()}`
  const now = new Date().toISOString()
  await pool.query(
    `INSERT INTO contacts (id, nombre, email, telefono, cargo, account_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [id, data.nombre, data.email || null, data.telefono || null, data.cargo || null, data.accountId, now]
  )
  return { id }
}

// ─── Deal queries ────────────────────────────────────────────────

function mapDeal(row: any): Deal {
  return {
    id: row.id,
    titulo: row.titulo,
    monto: parseFloat(row.monto) || 0,
    moneda: row.moneda || 'ARS',
    status: row.status,
    accountId: row.accountId,
    accountName: row.accountName || undefined,
    contactId: row.contactId || undefined,
    originLeadId: row.originLeadId || undefined,
    ownerId: row.ownerId || undefined,
    ownerName: row.ownerName || undefined,
    closedAt: row.closedAt || undefined,
    notas: row.notas || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

const DEAL_SELECT = `
  d.id, d.titulo, d.monto, d.moneda, d.status,
  d.account_id as "accountId", a.empresa as "accountName",
  d.contact_id as "contactId",
  d.origin_lead_id as "originLeadId",
  d.owner_id as "ownerId", u.nombre as "ownerName",
  d.closed_at as "closedAt", d.notas,
  d.created_at as "createdAt", d.updated_at as "updatedAt"
`

export async function getDealsByAccountId(accountId: string): Promise<Deal[]> {
  const result = await pool.query(
    `SELECT ${DEAL_SELECT}
     FROM deals d
     LEFT JOIN accounts a ON d.account_id = a.id
     LEFT JOIN users u ON d.owner_id = u.id
     WHERE d.account_id = $1 ORDER BY d.created_at DESC`,
    [accountId]
  )
  return result.rows.map(mapDeal)
}

export async function createDeal(data: {
  titulo: string; monto: number; moneda?: string; status: string;
  accountId: string; contactId?: string; originLeadId?: string; ownerId?: string; notas?: string
}): Promise<Deal> {
  const id = `deal-${Date.now()}`
  const now = new Date().toISOString()
  const closedAt = data.status === 'won' || data.status === 'lost' ? now : null
  await pool.query(
    `INSERT INTO deals (id, titulo, monto, moneda, status, account_id, contact_id, origin_lead_id, owner_id, closed_at, notas, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
    [id, data.titulo, data.monto, data.moneda || 'ARS', data.status, data.accountId,
     data.contactId || null, data.originLeadId || null, data.ownerId || null,
     closedAt, data.notas || null, now]
  )
  const result = await pool.query(
    `SELECT ${DEAL_SELECT}
     FROM deals d LEFT JOIN accounts a ON d.account_id = a.id LEFT JOIN users u ON d.owner_id = u.id
     WHERE d.id = $1`, [id]
  )
  return mapDeal(result.rows[0])
}

// ─── Convert lead ────────────────────────────────────────────────

export async function convertLead(leadId: string, accountId: string, contactId: string): Promise<void> {
  const now = new Date().toISOString()
  await pool.query(
    `UPDATE leads SET status = 'converted', converted_at = $1, account_id = $2, contact_id = $3, stage = 'ganado', updated_at = $1 WHERE id = $4`,
    [now, accountId, contactId, leadId]
  )
}

// ─── Converted leads by account ──────────────────────────────────

export async function getConvertedLeadsByAccountId(accountId: string): Promise<any[]> {
  const result = await pool.query(
    `SELECT id, nombre, empresa, email, telefono, producto, volumen,
       inversion_estimada as "inversionEstimada",
       created_at as "createdAt", converted_at as "convertedAt"
     FROM leads WHERE account_id = $1 AND status = 'converted'
     ORDER BY converted_at DESC`,
    [accountId]
  )
  return result.rows
}
