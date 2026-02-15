export type LeadStage = 'entrante' | 'primer-llamado' | 'seguimiento' | 'negociacion' | 'ganado' | 'perdido'

export type LeadPriority = 'A' | 'B' | 'C'

export type LeadSource = 'web' | 'referido' | 'redes' | 'llamada' | 'email' | 'otro'

export interface Lead {
  id: string
  nombre: string
  empresa: string
  email: string
  telefono: string
  producto: 'alfajores' | 'galletitas'
  marca: 'si' | 'no'
  volumen: 'menos-1000' | '1000-5000' | 'mas-5000'
  envasado: 'flowpack-personalizado' | 'flowpack-cristal' | 'a-granel'
  mensaje?: string
  inversionEstimada?: string
  stage: LeadStage
  createdAt: string
  updatedAt: string
  notes?: string[]
  lastContact?: string
  // Campos extendidos (opcionales, se mockean si no vienen de la API)
  source?: LeadSource
  owner?: string
  priority?: LeadPriority
  tags?: string[]
  nextTaskDate?: string
  nextTaskDescription?: string
  firstContactDate?: string
}

/** Fuentes disponibles */
export const LEAD_SOURCES: Array<{ id: LeadSource; label: string }> = [
  { id: 'web', label: 'Web' },
  { id: 'referido', label: 'Referido' },
  { id: 'redes', label: 'Redes Sociales' },
  { id: 'llamada', label: 'Llamada' },
  { id: 'email', label: 'Email' },
  { id: 'otro', label: 'Otro' },
]

/** Owners mock */
export const MOCK_OWNERS = ['Carlos M.', 'Ana P.', 'Lucas R.', 'María G.']

export const STAGES: Array<{ id: LeadStage; label: string; color: string }> = [
  { id: 'entrante', label: 'Entrante', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'primer-llamado', label: 'Primer Llamado', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'seguimiento', label: 'Seguimiento', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'negociacion', label: 'Negociación', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'ganado', label: 'Ganado', color: 'bg-green-100 text-green-800 border-green-300' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-800 border-red-300' },
]

