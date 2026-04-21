import { NextResponse } from 'next/server'
import { getSessionCookie, verifySession } from '@/lib/auth'

export async function GET() {
  const token = getSessionCookie()
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const session = await verifySession(token)
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({ user: session })
}
