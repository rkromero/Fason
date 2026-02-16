import pool from '../db'
import { Lead, LeadStage } from '@/lib/types/lead'

const LEAD_SELECT = `
  l.id,
  l.nombre,
  l.empresa,
  l.email,
  l.telefono,
  l.producto,
  l.marca,
  l.volumen,
  l.envasado,
  l.mensaje,
  l.inversion_estimada as "inversionEstimada",
  l.stage,
  l.owner_id as "ownerId",
  u.nombre as "owner",
  l.created_at as "createdAt",
  l.updated_at as "updatedAt",
  l.notes,
  l.last_contact as "lastContact",
  l.status,
  l.converted_at as "convertedAt",
  l.account_id as "accountId",
  l.contact_id as "contactId"
`

const LEAD_FROM = `FROM leads l LEFT JOIN users u ON l.owner_id = u.id`

function mapRowToLead(row: any): Lead {
  return {
    id: row.id,
    nombre: row.nombre,
    empresa: row.empresa,
    email: row.email,
    telefono: row.telefono,
    producto: row.producto,
    marca: row.marca,
    volumen: row.volumen,
    envasado: row.envasado,
    mensaje: row.mensaje || undefined,
    inversionEstimada: row.inversionEstimada || undefined,
    stage: row.stage,
    ownerId: row.ownerId || undefined,
    owner: row.owner || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    notes: Array.isArray(row.notes) ? row.notes : (row.notes ? JSON.parse(row.notes) : []),
    lastContact: row.lastContact || undefined,
    status: row.status || 'active',
    convertedAt: row.convertedAt || undefined,
    accountId: row.accountId || undefined,
    contactId: row.contactId || undefined,
  }
}

// Obtener todos los leads (excluye convertidos por defecto)
export async function getAllLeads(): Promise<Lead[]> {
  const result = await pool.query(
    `SELECT ${LEAD_SELECT} ${LEAD_FROM} WHERE (l.status IS NULL OR l.status = 'active') ORDER BY l.created_at DESC`
  )
  return result.rows.map(mapRowToLead)
}

// Obtener leads convertidos
export async function getConvertedLeads(): Promise<Lead[]> {
  const result = await pool.query(
    `SELECT ${LEAD_SELECT} ${LEAD_FROM} WHERE l.status = 'converted' ORDER BY l.converted_at DESC`
  )
  return result.rows.map(mapRowToLead)
}

// Obtener un lead por ID
export async function getLeadById(id: string): Promise<Lead | null> {
  const result = await pool.query(`SELECT ${LEAD_SELECT} ${LEAD_FROM} WHERE l.id = $1`, [id])
  if (result.rows.length === 0) return null
  return mapRowToLead(result.rows[0])
}

// Crear un nuevo lead
export async function createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
  const id = Date.now().toString()
  const now = new Date().toISOString()

  const result = await pool.query(
    `INSERT INTO leads (
      id, nombre, empresa, email, telefono, producto, marca, volumen,
      envasado, mensaje, inversion_estimada, stage, owner_id, created_at, updated_at, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14, $15)
    RETURNING
      id, nombre, empresa, email, telefono, producto, marca, volumen, envasado, mensaje,
      inversion_estimada as "inversionEstimada", stage, owner_id as "ownerId",
      created_at as "createdAt", updated_at as "updatedAt", notes, last_contact as "lastContact"`,
    [
      id, lead.nombre, lead.empresa, lead.email, lead.telefono,
      lead.producto, lead.marca, lead.volumen, lead.envasado,
      lead.mensaje || null, lead.inversionEstimada || null,
      lead.stage, lead.ownerId || null, now, JSON.stringify(lead.notes || []),
    ]
  )

  const row = result.rows[0]
  return mapRowToLead(row)
}

// Actualizar un lead
export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const fields: string[] = []
  const values: any[] = []
  let paramCount = 1

  if (updates.nombre !== undefined) { fields.push(`nombre = $${paramCount++}`); values.push(updates.nombre) }
  if (updates.empresa !== undefined) { fields.push(`empresa = $${paramCount++}`); values.push(updates.empresa) }
  if (updates.email !== undefined) { fields.push(`email = $${paramCount++}`); values.push(updates.email) }
  if (updates.telefono !== undefined) { fields.push(`telefono = $${paramCount++}`); values.push(updates.telefono) }
  if (updates.producto !== undefined) { fields.push(`producto = $${paramCount++}`); values.push(updates.producto) }
  if (updates.marca !== undefined) { fields.push(`marca = $${paramCount++}`); values.push(updates.marca) }
  if (updates.volumen !== undefined) { fields.push(`volumen = $${paramCount++}`); values.push(updates.volumen) }
  if (updates.envasado !== undefined) { fields.push(`envasado = $${paramCount++}`); values.push(updates.envasado) }
  if (updates.mensaje !== undefined) { fields.push(`mensaje = $${paramCount++}`); values.push(updates.mensaje) }
  if (updates.inversionEstimada !== undefined) { fields.push(`inversion_estimada = $${paramCount++}`); values.push(updates.inversionEstimada) }
  if (updates.stage !== undefined) { fields.push(`stage = $${paramCount++}`); values.push(updates.stage) }
  if (updates.ownerId !== undefined) { fields.push(`owner_id = $${paramCount++}`); values.push(updates.ownerId || null) }
  if (updates.notes !== undefined) { fields.push(`notes = $${paramCount++}`); values.push(JSON.stringify(updates.notes)) }
  if (updates.lastContact !== undefined) { fields.push(`last_contact = $${paramCount++}`); values.push(updates.lastContact) }

  fields.push(`updated_at = $${paramCount++}`)
  values.push(new Date().toISOString())

  values.push(id)

  if (fields.length === 1) {
    return getLeadById(id)
  }

  const result = await pool.query(
    `UPDATE leads l SET ${fields.join(', ')} WHERE l.id = $${paramCount}
     RETURNING
      l.id, l.nombre, l.empresa, l.email, l.telefono, l.producto, l.marca, l.volumen, l.envasado, l.mensaje,
      l.inversion_estimada as "inversionEstimada", l.stage, l.owner_id as "ownerId",
      l.created_at as "createdAt", l.updated_at as "updatedAt", l.notes, l.last_contact as "lastContact"`,
    values
  )

  if (result.rows.length === 0) return null

  // Fetch again with JOIN to get owner name
  return getLeadById(id)
}

// Eliminar un lead
export async function deleteLead(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM leads WHERE id = $1', [id])
  return result.rowCount !== null && result.rowCount > 0
}
