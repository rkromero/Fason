import pool, { generateId } from '../db'
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
  l.monto_estimado as "montoEstimado",
  l.stage,
  l.owner_id as "ownerId",
  u.nombre as "owner",
  l.created_at as "createdAt",
  l.updated_at as "updatedAt",
  l.notes,
  l.last_contact as "lastContact",
  l.source,
  l.priority,
  l.tags,
  l.lost_reason as "lostReason",
  l.lost_notes as "lostNotes",
  l.ficha_fason as "fichaFason",
  l.first_contact_date as "firstContactDate",
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
    source: row.source || undefined,
    priority: row.priority || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    lostReason: row.lostReason || undefined,
    lostNotes: row.lostNotes || undefined,
    fichaFason: row.fichaFason || undefined,
    firstContactDate: row.firstContactDate || undefined,
    status: row.status || 'active',
    convertedAt: row.convertedAt || undefined,
    accountId: row.accountId || undefined,
    contactId: row.contactId || undefined,
  }
}

// ─── Filtrado server-side ────────────────────────────────────────

export interface LeadFilters {
  search?: string
  producto?: string
  owner?: string
  stage?: string
  createdToday?: boolean
  sortBy?: 'updated' | 'created' | 'monto'
  sortDir?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface LeadQueryResult {
  leads: Lead[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getFilteredLeads(filters: LeadFilters = {}): Promise<LeadQueryResult> {
  const conditions: string[] = ['(l.status IS NULL OR l.status = \'active\')']
  const params: any[] = []
  let paramIdx = 1

  if (filters.search && filters.search.trim()) {
    const q = `%${filters.search.trim().toLowerCase()}%`
    conditions.push(`(LOWER(l.nombre) LIKE $${paramIdx} OR LOWER(l.empresa) LIKE $${paramIdx} OR LOWER(l.email) LIKE $${paramIdx} OR LOWER(l.telefono) LIKE $${paramIdx})`)
    params.push(q)
    paramIdx++
  }

  if (filters.producto && filters.producto !== 'all') {
    conditions.push(`l.producto = $${paramIdx}`)
    params.push(filters.producto)
    paramIdx++
  }

  if (filters.owner && filters.owner !== 'all') {
    conditions.push(`l.owner_id = $${paramIdx}`)
    params.push(filters.owner)
    paramIdx++
  }

  if (filters.stage && filters.stage !== 'all') {
    conditions.push(`l.stage = $${paramIdx}`)
    params.push(filters.stage)
    paramIdx++
  }

  if (filters.createdToday) {
    conditions.push(`l.created_at >= CURRENT_DATE AND l.created_at < CURRENT_DATE + INTERVAL '1 day'`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Sort — uses monto_estimado numeric column instead of REGEXP_REPLACE
  let orderBy: string
  switch (filters.sortBy) {
    case 'monto':
      orderBy = `ORDER BY l.monto_estimado ${filters.sortDir === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`
      break
    case 'created':
      orderBy = `ORDER BY l.created_at ${filters.sortDir === 'asc' ? 'ASC' : 'DESC'}`
      break
    default:
      orderBy = `ORDER BY l.updated_at DESC`
  }

  // Count + data in parallel
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(500, Math.max(1, filters.limit || 200))
  const offset = (page - 1) * limit

  const [countResult, dataResult] = await Promise.all([
    pool.query(`SELECT COUNT(*) as total ${LEAD_FROM} ${whereClause}`, params),
    pool.query(
      `SELECT ${LEAD_SELECT} ${LEAD_FROM} ${whereClause} ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    ),
  ])

  const total = parseInt(countResult.rows[0].total, 10)

  return {
    leads: dataResult.rows.map(mapRowToLead),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// Leads convertidos con paginación
export async function getConvertedLeads(page = 1, limit = 50): Promise<LeadQueryResult> {
  const offset = (page - 1) * limit

  const [countResult, dataResult] = await Promise.all([
    pool.query(`SELECT COUNT(*) as total FROM leads WHERE status = 'converted'`),
    pool.query(
      `SELECT ${LEAD_SELECT} ${LEAD_FROM} WHERE l.status = 'converted' ORDER BY l.converted_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
  ])

  const total = parseInt(countResult.rows[0].total, 10)

  return {
    leads: dataResult.rows.map(mapRowToLead),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// Mantener getAllLeads para compatibilidad con limit de seguridad
export async function getAllLeads(): Promise<Lead[]> {
  const result = await pool.query(
    `SELECT ${LEAD_SELECT} ${LEAD_FROM} WHERE (l.status IS NULL OR l.status = 'active') ORDER BY l.created_at DESC LIMIT 500`
  )
  return result.rows.map(mapRowToLead)
}

// Contadores de stage server-side (evita contar client-side)
export async function getLeadCountsByStage(): Promise<Record<string, number>> {
  const result = await pool.query(
    `SELECT stage, COUNT(*) as count FROM leads WHERE (status IS NULL OR status = 'active') GROUP BY stage`
  )
  const counts: Record<string, number> = {}
  for (const row of result.rows) {
    counts[row.stage] = parseInt(row.count, 10)
  }
  return counts
}

// Obtener un lead por ID
export async function getLeadById(id: string): Promise<Lead | null> {
  const result = await pool.query(`SELECT ${LEAD_SELECT} ${LEAD_FROM} WHERE l.id = $1`, [id])
  if (result.rows.length === 0) return null
  return mapRowToLead(result.rows[0])
}

// Crear un nuevo lead — UUID + monto_estimado sincronizado
export async function createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
  const id = generateId()
  const now = new Date().toISOString()
  const montoEstimado = lead.inversionEstimada
    ? parseFloat(lead.inversionEstimada.replace(/[^0-9.]/g, '')) || null
    : null

  await pool.query(
    `INSERT INTO leads (
      id, nombre, empresa, email, telefono, producto, marca, volumen,
      envasado, mensaje, inversion_estimada, monto_estimado, stage, owner_id,
      source, priority, tags, lost_reason, lost_notes, ficha_fason,
      created_at, updated_at, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21, $22)`,
    [
      id, lead.nombre, lead.empresa, lead.email, lead.telefono,
      lead.producto, lead.marca, lead.volumen, lead.envasado,
      lead.mensaje || null, lead.inversionEstimada || null, montoEstimado,
      lead.stage, lead.ownerId || null,
      lead.source || null, lead.priority || null, lead.tags || [], lead.lostReason || null, lead.lostNotes || null,
      lead.fichaFason ? JSON.stringify(lead.fichaFason) : null,
      now, JSON.stringify(lead.notes || []),
    ]
  )

  return (await getLeadById(id))!
}

// Actualizar un lead — mantiene monto_estimado sincronizado
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
  if (updates.inversionEstimada !== undefined) {
    fields.push(`inversion_estimada = $${paramCount++}`)
    values.push(updates.inversionEstimada)
    const monto = updates.inversionEstimada
      ? parseFloat(updates.inversionEstimada.replace(/[^0-9.]/g, '')) || null
      : null
    fields.push(`monto_estimado = $${paramCount++}`)
    values.push(monto)
  }
  if (updates.stage !== undefined) { fields.push(`stage = $${paramCount++}`); values.push(updates.stage) }
  if (updates.ownerId !== undefined) { fields.push(`owner_id = $${paramCount++}`); values.push(updates.ownerId || null) }
  if (updates.notes !== undefined) { fields.push(`notes = $${paramCount++}`); values.push(JSON.stringify(updates.notes)) }
  if (updates.lastContact !== undefined) { fields.push(`last_contact = $${paramCount++}`); values.push(updates.lastContact) }
  if (updates.source !== undefined) { fields.push(`source = $${paramCount++}`); values.push(updates.source || null) }
  if (updates.priority !== undefined) { fields.push(`priority = $${paramCount++}`); values.push(updates.priority || null) }
  if (updates.tags !== undefined) { fields.push(`tags = $${paramCount++}`); values.push(updates.tags || []) }
  if (updates.lostReason !== undefined) { fields.push(`lost_reason = $${paramCount++}`); values.push(updates.lostReason || null) }
  if (updates.lostNotes !== undefined) { fields.push(`lost_notes = $${paramCount++}`); values.push(updates.lostNotes || null) }
  if (updates.fichaFason !== undefined) { fields.push(`ficha_fason = $${paramCount++}`); values.push(JSON.stringify(updates.fichaFason)) }
  if (updates.firstContactDate !== undefined) { fields.push(`first_contact_date = $${paramCount++}`); values.push(updates.firstContactDate) }

  fields.push(`updated_at = $${paramCount++}`)
  values.push(new Date().toISOString())

  values.push(id)

  if (fields.length === 1) {
    return getLeadById(id)
  }

  await pool.query(
    `UPDATE leads SET ${fields.join(', ')} WHERE id = $${paramCount}`,
    values
  )

  return getLeadById(id)
}

// Eliminar un lead
export async function deleteLead(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM leads WHERE id = $1', [id])
  return result.rowCount !== null && result.rowCount > 0
}
