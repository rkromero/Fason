import pool from '../db'
import { Lead, LeadStage } from '@/lib/types/lead'

// Obtener todos los leads
export async function getAllLeads(): Promise<Lead[]> {
  const result = await pool.query(`
    SELECT 
      id,
      nombre,
      empresa,
      email,
      telefono,
      producto,
      marca,
      volumen,
      envasado,
      mensaje,
      inversion_estimada as "inversionEstimada",
      stage,
      created_at as "createdAt",
      updated_at as "updatedAt",
      notes,
      last_contact as "lastContact"
    FROM leads
    ORDER BY created_at DESC
  `)
  
  return result.rows.map(row => ({
    ...row,
    notes: Array.isArray(row.notes) ? row.notes : (row.notes ? JSON.parse(row.notes) : []),
  }))
}

// Obtener un lead por ID
export async function getLeadById(id: string): Promise<Lead | null> {
  const result = await pool.query(
    `
    SELECT 
      id,
      nombre,
      empresa,
      email,
      telefono,
      producto,
      marca,
      volumen,
      envasado,
      mensaje,
      inversion_estimada as "inversionEstimada",
      stage,
      created_at as "createdAt",
      updated_at as "updatedAt",
      notes,
      last_contact as "lastContact"
    FROM leads
    WHERE id = $1
    `,
    [id]
  )
  
  if (result.rows.length === 0) {
    return null
  }
  
  const row = result.rows[0]
  return {
    ...row,
    notes: Array.isArray(row.notes) ? row.notes : (row.notes ? JSON.parse(row.notes) : []),
  }
}

// Crear un nuevo lead
export async function createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
  const id = Date.now().toString()
  const now = new Date().toISOString()
  
  const result = await pool.query(
    `
    INSERT INTO leads (
      id, nombre, empresa, email, telefono, producto, marca, volumen, 
      envasado, mensaje, inversion_estimada, stage, created_at, updated_at, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING 
      id,
      nombre,
      empresa,
      email,
      telefono,
      producto,
      marca,
      volumen,
      envasado,
      mensaje,
      inversion_estimada as "inversionEstimada",
      stage,
      created_at as "createdAt",
      updated_at as "updatedAt",
      notes,
      last_contact as "lastContact"
    `,
    [
      id,
      lead.nombre,
      lead.empresa,
      lead.email,
      lead.telefono,
      lead.producto,
      lead.marca,
      lead.volumen,
      lead.envasado,
      lead.mensaje || null,
      lead.inversionEstimada || null,
      lead.stage,
      now,
      now,
      JSON.stringify(lead.notes || []),
    ]
  )
  
  const row = result.rows[0]
  return {
    ...row,
    notes: Array.isArray(row.notes) ? row.notes : (row.notes ? JSON.parse(row.notes) : []),
  }
}

// Actualizar un lead
export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const fields: string[] = []
  const values: any[] = []
  let paramCount = 1
  
  // Construir la query dinámicamente basada en los campos a actualizar
  if (updates.nombre !== undefined) {
    fields.push(`nombre = $${paramCount++}`)
    values.push(updates.nombre)
  }
  if (updates.empresa !== undefined) {
    fields.push(`empresa = $${paramCount++}`)
    values.push(updates.empresa)
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramCount++}`)
    values.push(updates.email)
  }
  if (updates.telefono !== undefined) {
    fields.push(`telefono = $${paramCount++}`)
    values.push(updates.telefono)
  }
  if (updates.producto !== undefined) {
    fields.push(`producto = $${paramCount++}`)
    values.push(updates.producto)
  }
  if (updates.marca !== undefined) {
    fields.push(`marca = $${paramCount++}`)
    values.push(updates.marca)
  }
  if (updates.volumen !== undefined) {
    fields.push(`volumen = $${paramCount++}`)
    values.push(updates.volumen)
  }
  if (updates.envasado !== undefined) {
    fields.push(`envasado = $${paramCount++}`)
    values.push(updates.envasado)
  }
  if (updates.mensaje !== undefined) {
    fields.push(`mensaje = $${paramCount++}`)
    values.push(updates.mensaje)
  }
  if (updates.inversionEstimada !== undefined) {
    fields.push(`inversion_estimada = $${paramCount++}`)
    values.push(updates.inversionEstimada)
  }
  if (updates.stage !== undefined) {
    fields.push(`stage = $${paramCount++}`)
    values.push(updates.stage)
  }
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramCount++}`)
    values.push(JSON.stringify(updates.notes))
  }
  if (updates.lastContact !== undefined) {
    fields.push(`last_contact = $${paramCount++}`)
    values.push(updates.lastContact)
  }
  
  // Siempre actualizar updated_at
  fields.push(`updated_at = $${paramCount++}`)
  values.push(new Date().toISOString())
  
  // Agregar el ID al final
  values.push(id)
  
  if (fields.length === 1) {
    // Solo updated_at, no hay nada que actualizar
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [id])
    if (result.rows.length === 0) return null
    return mapRowToLead(result.rows[0])
  }
  
  const query = `
    UPDATE leads
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING 
      id,
      nombre,
      empresa,
      email,
      telefono,
      producto,
      marca,
      volumen,
      envasado,
      mensaje,
      inversion_estimada as "inversionEstimada",
      stage,
      created_at as "createdAt",
      updated_at as "updatedAt",
      notes,
      last_contact as "lastContact"
  `
  
  const result = await pool.query(query, values)
  
  if (result.rows.length === 0) {
    return null
  }
  
  return mapRowToLead(result.rows[0])
}

// Eliminar un lead
export async function deleteLead(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM leads WHERE id = $1', [id])
  return result.rowCount !== null && result.rowCount > 0
}

// Función auxiliar para mapear filas de la BD a objetos Lead
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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    notes: Array.isArray(row.notes) ? row.notes : (row.notes ? JSON.parse(row.notes) : []),
    lastContact: row.lastContact || undefined,
  }
}

