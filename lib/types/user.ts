export type UserRole = 'admin' | 'vendedor' | 'viewer'

export interface User {
  id: string
  nombre: string
  email: string
  telefono?: string
  rol: UserRole
  activo: boolean
  createdAt: string
  updatedAt: string
}

export const USER_ROLES: Array<{ id: UserRole; label: string }> = [
  { id: 'admin', label: 'Administrador' },
  { id: 'vendedor', label: 'Vendedor' },
  { id: 'viewer', label: 'Solo lectura' },
]
