import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fason-crm-secret-key-change-in-production-2024')
const COOKIE_NAME = 'fason-session'

export interface SessionPayload {
  userId: string
  email: string
  nombre: string
  rol: string
}

export async function verifySessionEdge(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      nombre: payload.nombre as string,
      rol: payload.rol as string,
    }
  } catch {
    return null
  }
}

export { COOKIE_NAME }
