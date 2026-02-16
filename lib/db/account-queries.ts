import pool from '../db'
import { Account } from '@/lib/types/account'

const SELECT_FIELDS = `
  a.id, a.nombre, a.empresa, a.email, a.telefono, a.website, a.industria, a.notas,
  a.owner_id as "ownerId", u.nombre as "ownerName",
  a.created_at as "createdAt", a.updated_at as "updatedAt"
`

function mapRow(row: any): Account {
  return {
    id: row.id,
    nombre: row.nombre,
    empresa: row.empresa,
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

export async function getAllAccounts(): Promise<Account[]> {
  const result = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM accounts a LEFT JOIN users u ON a.owner_id = u.id ORDER BY a.created_at DESC`
  )
  return result.rows.map(mapRow)
}

export async function getAccountById(id: string): Promise<Account | null> {
  const result = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM accounts a LEFT JOIN users u ON a.owner_id = u.id WHERE a.id = $1`, [id]
  )
  return result.rows.length > 0 ? mapRow(result.rows[0]) : null
}

export async function searchAccounts(query: string): Promise<Account[]> {
  const result = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM accounts a LEFT JOIN users u ON a.owner_id = u.id
     WHERE a.empresa ILIKE $1 OR a.nombre ILIKE $1 OR a.email ILIKE $1
     ORDER BY a.empresa ASC LIMIT 20`,
    [`%${query}%`]
  )
  return result.rows.map(mapRow)
}

export async function createAccount(data: {
  nombre: string; empresa: string; email?: string; telefono?: string;
  website?: string; industria?: string; notas?: string; ownerId?: string
}): Promise<Account> {
  const id = `acc-${Date.now()}`
  const now = new Date().toISOString()
  await pool.query(
    `INSERT INTO accounts (id, nombre, empresa, email, telefono, website, industria, notas, owner_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
    [id, data.nombre, data.empresa, data.email || null, data.telefono || null,
     data.website || null, data.industria || null, data.notas || null, data.ownerId || null, now]
  )
  const account = await getAccountById(id)
  return account!
}

export async function convertLead(leadId: string, accountId: string, contactId: string): Promise<void> {
  const now = new Date().toISOString()
  await pool.query(
    `UPDATE leads SET status = 'converted', converted_at = $1, account_id = $2, contact_id = $3, stage = 'ganado', updated_at = $1 WHERE id = $4`,
    [now, accountId, contactId, leadId]
  )
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
