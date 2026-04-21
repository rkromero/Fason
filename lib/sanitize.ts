/**
 * Sanitiza texto para prevenir XSS al insertarlo en HTML.
 * Escapa caracteres peligrosos: & < > " '
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Sanitiza un objeto: escapa todos los strings.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj }
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      (result as any)[key] = escapeHtml(result[key])
    }
  }
  return result
}
