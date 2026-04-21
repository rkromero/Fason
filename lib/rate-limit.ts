/**
 * Rate limiter simple en memoria.
 * Para producción con múltiples instancias se debería usar Redis.
 */
import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada 60 segundos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 60000)
}

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, remaining: options.maxRequests - 1, retryAfterMs: 0 }
  }

  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    }
  }

  entry.count++
  return { allowed: true, remaining: options.maxRequests - entry.count, retryAfterMs: 0 }
}

export function rateLimitResponse(retryAfterMs: number): NextResponse {
  return NextResponse.json(
    { error: 'Demasiadas solicitudes. Intentá de nuevo en unos segundos.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
    }
  )
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}
