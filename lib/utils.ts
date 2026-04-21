import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWhatsAppUrl(phone: string): string | null {
  let clean = phone.replace(/[\s\-\(\)\+\.]/g, '').replace(/\D/g, '')
  if (!clean || clean.length < 8) return null
  if (clean.startsWith('0')) clean = clean.slice(1)
  if (!clean.startsWith('54') && clean.length <= 10) clean = `54${clean}`
  if (clean.length < 10) return null
  return `https://wa.me/${clean}`
}
