import { NextResponse } from 'next/server'
import { deleteSessionCookie } from '@/lib/auth'

export async function POST() {
  deleteSessionCookie()
  return NextResponse.json({ success: true })
}
