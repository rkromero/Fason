import { jwtVerify } from 'jose'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET es obligatorio en producción.')
    }
    return new TextEncoder().encode('dev-only-insecure-secret-do-not-use-in-prod')
  }
  return new TextEncoder().encode(secret)
}
const JWT_SECRET = getJwtSecret()
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
