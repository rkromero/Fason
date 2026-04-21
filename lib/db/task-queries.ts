import pool, { generateId } from '../db'
import { LeadTask, TaskStatus, TaskType } from '@/lib/types/lead'

function mapRowToTask(row: any): LeadTask {
  return {
    id: row.id,
    type: row.type as TaskType,
    description: row.description,
    dueDate: row.due_date,
    dueTime: row.due_time || undefined,
    notes: row.notes || undefined,
    status: row.status as TaskStatus,
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
  }
}

export async function getTasksByLeadId(leadId: string): Promise<LeadTask[]> {
  const result = await pool.query(
    `SELECT * FROM lead_tasks WHERE lead_id = $1 ORDER BY due_date ASC`,
    [leadId]
  )
  return result.rows.map(mapRowToTask)
}

export async function createTask(leadId: string, task: {
  type: TaskType
  description: string
  dueDate: string
  dueTime?: string
  notes?: string
}): Promise<LeadTask> {
  const id = generateId('task')
  const result = await pool.query(
    `INSERT INTO lead_tasks (id, lead_id, type, description, due_date, due_time, notes, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
     RETURNING *`,
    [id, leadId, task.type, task.description, task.dueDate, task.dueTime || null, task.notes || null]
  )
  return mapRowToTask(result.rows[0])
}

export async function completeTask(taskId: string): Promise<LeadTask | null> {
  const result = await pool.query(
    `UPDATE lead_tasks SET status = 'done', completed_at = NOW() WHERE id = $1 RETURNING *`,
    [taskId]
  )
  if (result.rows.length === 0) return null
  return mapRowToTask(result.rows[0])
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM lead_tasks WHERE id = $1', [taskId])
  return result.rowCount !== null && result.rowCount > 0
}

export async function getNextPendingTask(leadId: string): Promise<LeadTask | null> {
  const result = await pool.query(
    `SELECT * FROM lead_tasks WHERE lead_id = $1 AND status != 'done' ORDER BY due_date ASC LIMIT 1`,
    [leadId]
  )
  if (result.rows.length === 0) return null
  return mapRowToTask(result.rows[0])
}

export async function getOverdueTaskCount(leadId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM lead_tasks WHERE lead_id = $1 AND status != 'done' AND due_date < NOW()`,
    [leadId]
  )
  return parseInt(result.rows[0].count, 10)
}

// Obtener próxima tarea y overdue count para múltiples leads de una vez (batch)
export async function getTaskSummariesForLeads(leadIds: string[]): Promise<Record<string, {
  nextTask?: LeadTask
  overdueCount: number
  pendingCount: number
}>> {
  if (leadIds.length === 0) return {}

  const [nextTasks, counts] = await Promise.all([
    pool.query(
      `SELECT DISTINCT ON (lead_id) * FROM lead_tasks
       WHERE lead_id = ANY($1) AND status != 'done'
       ORDER BY lead_id, due_date ASC`,
      [leadIds]
    ),
    pool.query(
      `SELECT lead_id,
        COUNT(*) FILTER (WHERE status != 'done') as pending,
        COUNT(*) FILTER (WHERE status != 'done' AND due_date < NOW()) as overdue
       FROM lead_tasks WHERE lead_id = ANY($1)
       GROUP BY lead_id`,
      [leadIds]
    ),
  ])

  const result: Record<string, { nextTask?: LeadTask; overdueCount: number; pendingCount: number }> = {}

  for (const id of leadIds) {
    result[id] = { overdueCount: 0, pendingCount: 0 }
  }

  for (const row of nextTasks.rows) {
    if (result[row.lead_id]) {
      result[row.lead_id].nextTask = mapRowToTask(row)
    }
  }

  for (const row of counts.rows) {
    if (result[row.lead_id]) {
      result[row.lead_id].pendingCount = parseInt(row.pending, 10)
      result[row.lead_id].overdueCount = parseInt(row.overdue, 10)
    }
  }

  return result
}
