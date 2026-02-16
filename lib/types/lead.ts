export type LeadStage = 'entrante' | 'primer-llamado' | 'seguimiento' | 'negociacion' | 'ganado' | 'perdido'

export type DensityMode = 'compact' | 'comfortable'

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

export interface StageConfig {
  id: LeadStage
  label: string
  color: string
  /** Tailwind bg class for the small accent dot/indicator */
  dot: string
  /** Tailwind text class for count badge */
  badge: string
}

export const STAGES: StageConfig[] = [
  { id: 'entrante', label: 'Entrante', color: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500', badge: 'text-blue-700 bg-blue-50' },
  { id: 'primer-llamado', label: 'Primer Llamado', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500', badge: 'text-amber-700 bg-amber-50' },
  { id: 'seguimiento', label: 'Seguimiento', color: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500', badge: 'text-orange-700 bg-orange-50' },
  { id: 'negociacion', label: 'Negociación', color: 'bg-violet-100 text-violet-800 border-violet-300', dot: 'bg-violet-500', badge: 'text-violet-700 bg-violet-50' },
  { id: 'ganado', label: 'Ganado', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-400', badge: 'text-red-600 bg-red-50' },
]

