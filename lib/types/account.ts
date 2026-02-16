export interface Account {
  id: string
  nombre: string
  empresa: string
  cuit?: string
  email: string
  telefono: string
  website?: string
  industria?: string
  notas?: string
  ownerId?: string
  ownerName?: string
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  nombre: string
  email: string
  telefono: string
  cargo?: string
  accountId: string
  accountName?: string
  createdAt: string
  updatedAt: string
}

export type DealStatus = 'won' | 'lost' | 'open'

export interface Deal {
  id: string
  titulo: string
  monto: number
  moneda: string
  status: DealStatus
  accountId: string
  accountName?: string
  contactId?: string
  originLeadId?: string
  ownerId?: string
  ownerName?: string
  closedAt?: string
  notas?: string
  createdAt: string
  updatedAt: string
}

export const DEAL_STATUSES: Array<{ id: DealStatus; label: string; color: string }> = [
  { id: 'won', label: 'Ganado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'open', label: 'Abierto', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'lost', label: 'Perdido', color: 'bg-red-100 text-red-700 border-red-200' },
]

export interface DuplicateMatch {
  account: Account
  matchType: 'cuit' | 'email' | 'telefono' | 'nombre'
  confidence: 'high' | 'medium'
}
