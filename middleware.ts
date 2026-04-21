import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionEdge, COOKIE_NAME } from '@/lib/auth-edge'

// Rutas API que NO requieren autenticación
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/contact',
]

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── Proteger rutas API ──────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Rutas públicas: no requieren auth
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next()
    }

    // Todas las demás APIs requieren autenticación
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const session = await verifySessionEdge(token)
    if (!session) {
      return NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 })
    }

    // Rutas admin-only: /api/db/*, /api/users (POST/PUT/DELETE)
    if (pathname.startsWith('/api/db/')) {
      if (session.rol !== 'admin') {
        return NextResponse.json({ error: 'Requiere permisos de administrador' }, { status: 403 })
      }
    }

    // Pasar session info al request via headers (para que las routes puedan leerla)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.userId)
    requestHeaders.set('x-user-email', session.email)
    requestHeaders.set('x-user-rol', session.rol)
    requestHeaders.set('x-user-nombre', session.nombre)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // ─── Proteger rutas /admin (páginas) ─────────────────────
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const session = await verifySessionEdge(token)
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
      return response
    }

    return NextResponse.next()
  }

  // ─── Redirect si ya logueado ─────────────────────────────
  if (pathname === '/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (token) {
      const session = await verifySessionEdge(token)
      if (session) {
        return NextResponse.redirect(new URL('/admin/crm', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/api/:path*'],
}
