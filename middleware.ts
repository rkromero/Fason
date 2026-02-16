import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionEdge, COOKIE_NAME } from '@/lib/auth-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas protegidas: todo lo que empiece con /admin
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
      // Borrar cookie inválida
      const response = NextResponse.redirect(loginUrl)
      response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
      return response
    }

    return NextResponse.next()
  }

  // Si ya está logueado y va a /login, redirigir al CRM
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
  matcher: ['/admin/:path*', '/login'],
}
