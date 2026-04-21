import { Pool, PoolClient } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 15000,
})

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err)
})

// ─── Retry wrapper ──────────────────────────────────────────────
export async function queryWithRetry<T = any>(
  text: string,
  params?: any[],
  retries = 2
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return (await pool.query(text, params)) as T
    } catch (err: any) {
      const isTransient = err.code === 'ECONNREFUSED' || err.code === '57P01' || err.code === '57P03' || err.message?.includes('Connection terminated')
      if (isTransient && attempt < retries) {
        console.warn(`DB query retry ${attempt + 1}/${retries}:`, err.message)
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error('Query retries exhausted')
}

// ─── Health check ───────────────────────────────────────────────
export async function checkPoolHealth(): Promise<{ healthy: boolean; total: number; idle: number; waiting: number }> {
  try {
    await pool.query('SELECT 1')
    return {
      healthy: true,
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    }
  } catch {
    return { healthy: false, total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount }
  }
}

// ─── Transaction helper ─────────────────────────────────────────
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── UUID generator ─────────────────────────────────────────────
export function generateId(prefix?: string): string {
  const uuid = crypto.randomUUID()
  return prefix ? `${prefix}-${uuid}` : uuid
}

export default pool
