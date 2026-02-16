import pool from '../db'
import { User } from '@/lib/types/user'

const SELECT_FIELDS = `
  id, nombre, email, telefono, rol,
  activo,
  created_at as "createdAt",
  updated_at as "updatedAt"
`

function mapRow(row: any): User {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono || undefined,
    rol: row.rol,
    activo: row.activo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getAllUsers(): Promise<User[]> {
  const result = await pool.query(`SELECT ${SELECT_FIELDS} FROM users ORDER BY nombre ASC`)
  return result.rows.map(mapRow)
}

export async function getActiveUsers(): Promise<User[]> {
  const result = await pool.query(`SELECT ${SELECT_FIELDS} FROM users WHERE activo = true ORDER BY nombre ASC`)
  return result.rows.map(mapRow)
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query(`SELECT ${SELECT_FIELDS} FROM users WHERE id = $1`, [id])
  if (result.rows.length === 0) return null
  return mapRow(result.rows[0])
}

export async function createUser(data: { nombre: string; email: string; telefono?: string; rol: string }): Promise<User> {
  const id = `usr-${Date.now()}`
  const now = new Date().toISOString()

  const result = await pool.query(
    `INSERT INTO users (id, nombre, email, telefono, rol, activo, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, $6, $6)
     RETURNING ${SELECT_FIELDS}`,
    [id, data.nombre, data.email, data.telefono || null, data.rol, now]
  )

  return mapRow(result.rows[0])
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const fields: string[] = []
  const values: any[] = []
  let p = 1

  if (updates.nombre !== undefined) { fields.push(`nombre = $${p++}`); values.push(updates.nombre) }
  if (updates.email !== undefined) { fields.push(`email = $${p++}`); values.push(updates.email) }
  if (updates.telefono !== undefined) { fields.push(`telefono = $${p++}`); values.push(updates.telefono || null) }
  if (updates.rol !== undefined) { fields.push(`rol = $${p++}`); values.push(updates.rol) }
  if (updates.activo !== undefined) { fields.push(`activo = $${p++}`); values.push(updates.activo) }

  fields.push(`updated_at = $${p++}`)
  values.push(new Date().toISOString())

  values.push(id)

  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${p} RETURNING ${SELECT_FIELDS}`,
    values
  )

  if (result.rows.length === 0) return null
  return mapRow(result.rows[0])
}

export async function deleteUser(id: string): Promise<boolean> {
  // Desasignar leads del usuario antes de borrar
  await pool.query(`UPDATE leads SET owner_id = NULL, updated_at = $1 WHERE owner_id = $2`, [new Date().toISOString(), id])
  const result = await pool.query('DELETE FROM users WHERE id = $1', [id])
  return result.rowCount !== null && result.rowCount > 0
}
