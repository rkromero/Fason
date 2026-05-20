import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET es obligatorio en producción. Configurá la variable de entorno.')
    }
    console.warn('ADVERTENCIA: JWT_SECRET no configurado. Usando secret de desarrollo (NO usar en producción).')
    return new TextEncoder().encode('dev-only-insecure-secret-do-not-use-in-prod')
  }
  return new TextEncoder().encode(secret)
}
const COOKIE_NAME = 'fason-session'
const SESSION_DURATION = 60 * 60 * 24 * 7 // 7 days in seconds

export interface SessionPayload {
  userId: string
  email: string
  nombre: string
  rol: string
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DURATION}s`)
    .setIssuedAt()
    .sign(getJwtSecret())

  return token
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
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

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })
}

export function deleteSessionCookie() {
  cookies().set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

export function getSessionCookie(): string | undefined {
  return cookies().get(COOKIE_NAME)?.value
}
