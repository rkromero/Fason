export interface Account {
  id: string
  nombre: string
  empresa: string
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
