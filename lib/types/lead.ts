export type LeadStage = 'entrante' | 'primer-llamado' | 'seguimiento' | 'negociacion' | 'ganado' | 'perdido'

export type DensityMode = 'compact' | 'comfortable'

export type LeadPriority = 'A' | 'B' | 'C'

export type LeadSource = 'web' | 'referido' | 'redes' | 'llamada' | 'email' | 'otro'

// ─── Tasks ──────────────────────────────────────────────────────
export type TaskType = 'llamada' | 'email' | 'whatsapp' | 'reunion' | 'seguimiento' | 'otro'
export type TaskStatus = 'pending' | 'done' | 'overdue'

export interface LeadTask {
  id: string
  type: TaskType
  description: string
  dueDate: string
  dueTime?: string
  notes?: string
  status: TaskStatus
  createdAt: string
  completedAt?: string
}

export const TASK_TYPES: Array<{ id: TaskType; label: string; emoji: string }> = [
  { id: 'llamada', label: 'Llamada', emoji: '📞' },
  { id: 'email', label: 'Email', emoji: '✉️' },
  { id: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { id: 'reunion', label: 'Reunión', emoji: '🤝' },
  { id: 'seguimiento', label: 'Seguimiento', emoji: '🔄' },
  { id: 'otro', label: 'Otro', emoji: '📋' },
]

// ─── Activity Timeline ──────────────────────────────────────────
export type ActivityType = 'note' | 'call' | 'email' | 'whatsapp' | 'stage-change' | 'owner-change' | 'task-done' | 'created'

export interface Activity {
  id: string
  type: ActivityType
  date: string
  content: string
  metadata?: Record<string, string>
}

// ─── Ficha Fason ────────────────────────────────────────────────
export interface FichaFason {
  productoDetalle?: string
  volumenMensual?: string
  packaging?: string
  insumoCliente?: string
  fechaObjetivo?: string
  checklist?: {
    fichaProducto: boolean
    muestraAprobada: boolean
    precioAcordado: boolean
    arteFinal: boolean
    logistica: boolean
  }
}

// ─── Motivo de perdido ──────────────────────────────────────────
export const LOST_REASONS = [
  'Precio alto',
  'Eligió competencia',
  'No responde',
  'Sin presupuesto',
  'Timing incorrecto',
  'Producto no adecuado',
  'Otro',
] as const

export type LostReason = typeof LOST_REASONS[number]

// ─── Lead ───────────────────────────────────────────────────────
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
  ownerId?: string
  owner?: string
  createdAt: string
  updatedAt: string
  notes?: string[]
  lastContact?: string
  source?: LeadSource
  priority?: LeadPriority
  tags?: string[]
  nextTaskDate?: string
  nextTaskDescription?: string
  firstContactDate?: string
  tasks?: LeadTask[]
  activities?: Activity[]
  fichaFason?: FichaFason
  lostReason?: LostReason
  lostNotes?: string
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


export interface StageConfig {
  id: LeadStage
  label: string
  color: string
  dot: string
  badge: string
  bar: string
}

export const STAGES: StageConfig[] = [
  { id: 'entrante', label: 'Entrante', color: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500', badge: 'text-blue-700 bg-blue-50', bar: 'bg-blue-500' },
  { id: 'primer-llamado', label: 'Primer Llamado', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500', badge: 'text-amber-700 bg-amber-50', bar: 'bg-amber-500' },
  { id: 'seguimiento', label: 'Seguimiento', color: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500', badge: 'text-orange-700 bg-orange-50', bar: 'bg-orange-500' },
  { id: 'negociacion', label: 'Negociación', color: 'bg-violet-100 text-violet-800 border-violet-300', dot: 'bg-violet-500', badge: 'text-violet-700 bg-violet-50', bar: 'bg-violet-500' },
  { id: 'ganado', label: 'Ganado', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50', bar: 'bg-emerald-500' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-400', badge: 'text-red-600 bg-red-50', bar: 'bg-red-400' },
]

// ─── Helpers ────────────────────────────────────────────────────
export function getNextTask(lead: Lead): LeadTask | undefined {
  if (!lead.tasks) return undefined
  return lead.tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
}

export function isTaskOverdue(task: LeadTask): boolean {
  return task.status !== 'done' && new Date(task.dueDate) < new Date()
}

export function getOverdueTaskCount(lead: Lead): number {
  if (!lead.tasks) return 0
  return lead.tasks.filter(isTaskOverdue).length
}
