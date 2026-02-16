import pool, { generateId } from '../db'
import { Activity, ActivityType } from '@/lib/types/lead'

function mapRowToActivity(row: any): Activity {
  return {
    id: row.id,
    type: row.type as ActivityType,
    date: row.created_at,
    content: row.content,
    metadata: row.metadata || undefined,
  }
}

export async function getActivitiesByLeadId(leadId: string): Promise<Activity[]> {
  const result = await pool.query(
    `SELECT la.*, u.nombre as user_name FROM lead_activities la
     LEFT JOIN users u ON la.created_by = u.id
     WHERE la.lead_id = $1 ORDER BY la.created_at DESC`,
    [leadId]
  )
  return result.rows.map((row: any) => ({
    ...mapRowToActivity(row),
    metadata: {
      ...(row.metadata || {}),
      ...(row.user_name ? { userName: row.user_name } : {}),
    },
  }))
}

export async function createActivity(leadId: string, activity: {
  type: ActivityType
  content: string
  metadata?: Record<string, string>
  createdBy?: string
}): Promise<Activity> {
  const id = generateId('act')
  const result = await pool.query(
    `INSERT INTO lead_activities (id, lead_id, type, content, metadata, created_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [
      id,
      leadId,
      activity.type,
      activity.content,
      activity.metadata ? JSON.stringify(activity.metadata) : null,
      activity.createdBy || null,
    ]
  )
  return mapRowToActivity(result.rows[0])
}

export async function getRecentActivityDate(leadId: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT created_at FROM lead_activities WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [leadId]
  )
  if (result.rows.length === 0) return null
  return result.rows[0].created_at
}
