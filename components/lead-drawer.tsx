"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Lead, LeadStage, LeadTask, TaskType, Activity, STAGES, TASK_TYPES, LOST_REASONS, LostReason,
  isTaskOverdue,
} from '@/lib/types/lead'
import { User } from '@/lib/types/user'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Mail, Phone, Building2, MessageCircle, Send, CalendarCheck, FileText,
  Plus, Pencil, Check, X, PhoneCall, MailOpen, Clock, AlertCircle,
  Package, CheckSquare, Square, ChevronRight, Trash2, Loader2,
} from 'lucide-react'

interface LeadDrawerProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void
}

type DrawerTab = 'resumen' | 'tareas' | 'timeline' | 'ficha'

// ─── Helpers ────────────────────────────────────────────────────
function getTimelineIcon(type: Activity['type']) {
  const map: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
    note: { icon: FileText, color: 'text-[var(--crm-text-muted)]', bg: 'bg-[var(--crm-bg-subtle)]' },
    call: { icon: PhoneCall, color: 'text-[var(--crm-info)]', bg: 'bg-[var(--crm-info-light)]' },
    email: { icon: MailOpen, color: 'text-violet-600', bg: 'bg-violet-50' },
    whatsapp: { icon: MessageCircle, color: 'text-[var(--crm-success)]', bg: 'bg-[var(--crm-success-light)]' },
    'stage-change': { icon: ChevronRight, color: 'text-[var(--crm-warning)]', bg: 'bg-[var(--crm-warning-light)]' },
    'owner-change': { icon: Pencil, color: 'text-[var(--crm-info)]', bg: 'bg-[var(--crm-info-light)]' },
    'task-done': { icon: Check, color: 'text-[var(--crm-success)]', bg: 'bg-[var(--crm-success-light)]' },
    created: { icon: Plus, color: 'text-[var(--crm-text-muted)]', bg: 'bg-[var(--crm-bg-muted)]' },
  }
  return map[type] || map.created
}

function formatRelativeDate(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}min`
  if (diffH < 24) return `Hace ${diffH}h`
  if (diffD === 1) return 'Ayer'
  if (diffD < 7) return `Hace ${diffD}d`
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

function getOwnerInitial(o?: string) { return o ? o.charAt(0).toUpperCase() : '?' }
const OC = ['bg-blue-600', 'bg-violet-600', 'bg-teal-600', 'bg-pink-600', 'bg-indigo-600', 'bg-orange-500', 'bg-emerald-600', 'bg-rose-500']
function getOwnerColor(o?: string) { if (!o) return 'bg-gray-400'; let h = 0; for (let i = 0; i < o.length; i++) h = o.charCodeAt(i) + ((h << 5) - h); return OC[Math.abs(h) % OC.length] }

// ─── Component ──────────────────────────────────────────────────
export function LeadDrawer({ lead, open, onOpenChange, onUpdateLead }: LeadDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('resumen')
  const [currentStage, setCurrentStage] = useState<LeadStage>(lead.stage)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newNote, setNewNote] = useState('')

  // Tasks (from API)
  const [tasks, setTasks] = useState<LeadTask[]>([])
  const [tasksLoaded, setTasksLoaded] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskType, setTaskType] = useState<TaskType>('llamada')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskDate, setTaskDate] = useState('')
  const [taskNotes, setTaskNotes] = useState('')

  // Activities (from API)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoaded, setActivitiesLoaded] = useState(false)

  // Lost reason
  const [showLostDialog, setShowLostDialog] = useState(false)
  const [lostReason, setLostReason] = useState<LostReason | ''>('')
  const [lostNotes, setLostNotes] = useState('')
  const [pendingStage, setPendingStage] = useState<LeadStage | null>(null)

  // Ficha
  const [ficha, setFicha] = useState(lead.fichaFason || {})

  // Users for owner assignment
  const [availableUsers, setAvailableUsers] = useState<User[]>([])

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.ok ? r.json() : { users: [] })
      .then((data) => setAvailableUsers((data.users || []).filter((u: User) => u.activo)))
      .catch(() => {})
  }, [])

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/tasks`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch {
      console.error('Error fetching tasks')
    } finally {
      setTasksLoaded(true)
    }
  }, [lead.id])

  // Fetch activities from API
  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/activities`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch {
      console.error('Error fetching activities')
    } finally {
      setActivitiesLoaded(true)
    }
  }, [lead.id])

  // Load tasks + activities when drawer opens
  useEffect(() => {
    if (open) {
      setTasksLoaded(false)
      setActivitiesLoaded(false)
      fetchTasks()
      fetchActivities()
    }
  }, [open, lead.id, fetchTasks, fetchActivities])

  const pendingTasks = useMemo(() =>
    tasks.filter((t) => t.status !== 'done').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [tasks]
  )
  const doneTasks = useMemo(() => tasks.filter((t) => t.status === 'done'), [tasks])

  // Build timeline from activities + "created" entry
  const timeline = useMemo(() => {
    const entries: Activity[] = [
      { id: 'created', type: 'created', date: lead.createdAt, content: 'Lead creado' },
      ...activities,
    ]
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return entries
  }, [activities, lead.createdAt])

  useEffect(() => {
    setCurrentStage(lead.stage)
    setFicha(lead.fichaFason || {})
  }, [lead])

  const doUpdate = async (updates: Partial<Lead>) => {
    setIsUpdating(true)
    try {
      if (onUpdateLead) await onUpdateLead(lead.id, updates)
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStageChange = async (newStage: LeadStage) => {
    if (newStage === lead.stage) return
    if (newStage === 'perdido') {
      setPendingStage(newStage)
      setShowLostDialog(true)
      return
    }
    const oldStage = currentStage
    setCurrentStage(newStage)
    await doUpdate({ stage: newStage })
    // Log stage change activity
    await fetch(`/api/leads/${lead.id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'stage-change',
        content: `Etapa cambiada: ${STAGES.find(s => s.id === oldStage)?.label} → ${STAGES.find(s => s.id === newStage)?.label}`,
        metadata: { from: oldStage, to: newStage },
      }),
    })
    fetchActivities()
  }

  const handleConfirmLost = async () => {
    if (!lostReason) { toast.error('Seleccioná un motivo'); return }
    setCurrentStage('perdido')
    await doUpdate({ stage: 'perdido', lostReason: lostReason as LostReason, lostNotes: lostNotes || undefined })
    await fetch(`/api/leads/${lead.id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'stage-change',
        content: `Lead perdido: ${lostReason}${lostNotes ? ` — ${lostNotes}` : ''}`,
        metadata: { reason: lostReason },
      }),
    })
    fetchActivities()
    setShowLostDialog(false)
    setLostReason('')
    setLostNotes('')
    setPendingStage(null)
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', content: newNote.trim() }),
      })
      if (res.ok) {
        setNewNote('')
        fetchActivities()
        toast.success('Nota agregada')
      }
    } catch {
      toast.error('Error al agregar nota')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddTask = async () => {
    if (!taskDesc.trim() || !taskDate) { toast.error('Completá descripción y fecha'); return }
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: taskType,
          description: taskDesc.trim(),
          dueDate: new Date(taskDate).toISOString(),
          notes: taskNotes || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
        setShowTaskForm(false)
        setTaskDesc('')
        setTaskDate('')
        setTaskNotes('')
        setTaskType('llamada')
        toast.success('Tarea creada')
      }
    } catch {
      toast.error('Error al crear tarea')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', taskId }),
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
        toast.success('Tarea completada')
        fetchActivities()
      }
    } catch {
      toast.error('Error al completar tarea')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', taskId }),
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch {
      toast.error('Error al eliminar tarea')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveFicha = async () => {
    await doUpdate({ fichaFason: ficha })
    toast.success('Ficha guardada')
  }

  const handleWhatsAppClick = () => {
    let p = lead.telefono.replace(/[\s\-\(\)\+\.]/g, '').replace(/\D/g, '')
    if (!p || p.length < 8) { toast.error('Teléfono inválido'); return }
    if (p.startsWith('0')) p = p.substring(1)
    if (!p.startsWith('54') && p.length <= 10) p = `54${p}`
    window.open(`https://wa.me/${p}`, '_blank')
  }

  const stageConfig = STAGES.find((s) => s.id === currentStage)
  const ageDays = Math.max(0, Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000))

  const TABS: Array<{ id: DrawerTab; label: string; count?: number }> = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'tareas', label: 'Tareas', count: pendingTasks.length },
    { id: 'timeline', label: 'Actividad', count: activitiesLoaded ? activities.length : undefined },
    { id: 'ficha', label: 'Ficha Fason' },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden" aria-label={`Detalle del lead: ${lead.nombre}`}>
        {/* Header */}
        <SheetHeader className="px-3 sm:px-5 pt-3 sm:pt-5 pb-2 sm:pb-3 border-b border-[var(--crm-border-light)] shrink-0">
          <div className="flex items-start gap-2 sm:gap-3">
            <span className={cn('flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs sm:text-sm font-bold text-white shrink-0 mt-0.5', getOwnerColor(lead.owner))}>
              {getOwnerInitial(lead.owner)}
            </span>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-[14px] sm:text-[15px] font-semibold text-[var(--crm-text)] truncate">{lead.nombre}</SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-[var(--crm-text-secondary)] mt-0.5">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.empresa}</span>
              </SheetDescription>
            </div>
            <Select value={currentStage} onValueChange={handleStageChange} disabled={isUpdating}>
              <SelectTrigger className="h-7 w-auto gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] font-medium border-[var(--crm-border)] rounded-[var(--crm-radius-md)] px-2 sm:px-2.5 shrink-0">
                <span className={cn('h-2 w-2 rounded-full', stageConfig?.dot)} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', s.dot)} />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0.5 mt-2 sm:mt-3 -mb-[1px] overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-[12px] font-medium rounded-t-[var(--crm-radius-md)] border border-b-0 transition-colors whitespace-nowrap',
                  tab === t.id
                    ? 'bg-[var(--crm-bg-card)] text-[var(--crm-text)] border-[var(--crm-border-light)]'
                    : 'text-[var(--crm-text-muted)] border-transparent hover:text-[var(--crm-text-secondary)]'
                )}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className="ml-1 crm-mono text-[10px] text-[var(--crm-text-muted)]">{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ═══ RESUMEN ═══ */}
          {tab === 'resumen' && (
            <div className="px-3 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
              {/* Acciones rápidas */}
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-8 sm:h-7 flex-1 sm:flex-none text-[12px] gap-1.5 rounded-[var(--crm-radius-md)] border-[var(--crm-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]" onClick={() => window.open(`mailto:${lead.email}`, '_blank')}>
                  <Mail className="h-3.5 sm:h-3 w-3.5 sm:w-3" /> <span className="hidden sm:inline">Email</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 sm:h-7 flex-1 sm:flex-none text-[12px] gap-1.5 rounded-[var(--crm-radius-md)] border-[var(--crm-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]" onClick={() => window.open(`tel:${lead.telefono}`, '_blank')}>
                  <Phone className="h-3.5 sm:h-3 w-3.5 sm:w-3" /> Llamar
                </Button>
                <Button variant="outline" size="sm" className="h-8 sm:h-7 flex-1 sm:flex-none text-[12px] gap-1.5 rounded-[var(--crm-radius-md)] border-[var(--crm-border)] text-[var(--crm-success)] hover:bg-[var(--crm-success-light)]" onClick={handleWhatsAppClick}>
                  <MessageCircle className="h-3.5 sm:h-3 w-3.5 sm:w-3" /> WhatsApp
                </Button>
              </div>

              {/* Datos del formulario */}
              <div className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] overflow-hidden">
                <div className="px-3 py-2 bg-[var(--crm-bg-subtle)] border-b border-[var(--crm-border-light)]">
                  <p className="crm-label font-semibold">Información del lead</p>
                </div>
                <div className="divide-y divide-[var(--crm-border-light)]">
                  {[
                    ['Nombre', lead.nombre],
                    ['Empresa', lead.empresa],
                    ['Email', lead.email, true],
                    ['Teléfono', lead.telefono, false, true],
                    ['Producto', lead.producto === 'alfajores' ? 'Alfajores' : 'Galletitas'],
                    ['Marca', lead.marca === 'si' ? 'Sí' : 'No'],
                    ['Volumen', lead.volumen === 'menos-1000' ? '<1,000 u/mes' : lead.volumen === '1000-5000' ? '1-5K u/mes' : '>5K u/mes'],
                    ['Envasado', lead.envasado === 'flowpack-personalizado' ? 'Flowpack Pers.' : lead.envasado === 'flowpack-cristal' ? 'Flowpack Cristal' : 'A Granel'],
                    ...(lead.inversionEstimada ? [['Inversión', `$${lead.inversionEstimada}`]] : []),
                    ...(lead.source ? [['Fuente', lead.source]] : []),
                    ...(lead.priority ? [['Prioridad', lead.priority]] : []),
                    ...(lead.tags && lead.tags.length > 0 ? [['Tags', lead.tags.join(', ')]] : []),
                    ...(lead.mensaje ? [['Mensaje', lead.mensaje]] : []),
                  ].map(([label, value, isEmail, isPhone], i) => (
                    <div key={i} className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] px-3 py-2">
                      <span className="crm-meta text-[11px] sm:text-[12px]">{label}</span>
                      {isEmail ? (
                        <a href={`mailto:${value}`} className="crm-body text-[var(--crm-primary)] hover:underline truncate text-[12px] sm:text-[13px]">{value}</a>
                      ) : isPhone ? (
                        <a href={`tel:${value}`} className="crm-body text-[var(--crm-primary)] hover:underline text-[12px] sm:text-[13px]">{value}</a>
                      ) : (
                        <span className="crm-body font-medium text-[var(--crm-text)] text-[12px] sm:text-[13px]">{value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info adicional */}
              <div className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] overflow-hidden">
                <div className="px-3 py-2 bg-[var(--crm-bg-subtle)] border-b border-[var(--crm-border-light)]">
                  <p className="crm-label font-semibold">Estado del pipeline</p>
                </div>
                <div className="divide-y divide-[var(--crm-border-light)]">
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] px-3 py-2">
                    <span className="crm-meta text-[11px] sm:text-[12px]">Etapa</span>
                    <span className={cn('crm-badge inline-flex w-fit', stageConfig?.badge)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full mr-1', stageConfig?.dot)} />
                      {stageConfig?.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] px-3 py-2">
                    <span className="crm-meta text-[11px] sm:text-[12px]">Pipeline</span>
                    <span className="crm-body crm-mono text-[var(--crm-text)] text-[12px] sm:text-[13px]">{ageDays} días</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] px-3 py-2">
                    <span className="crm-meta text-[11px] sm:text-[12px]">Creado</span>
                    <span className="crm-body crm-mono text-[var(--crm-text)] text-[12px] sm:text-[13px]">{new Date(lead.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] px-3 py-2">
                    <span className="crm-meta text-[11px] sm:text-[12px]">Actualizado</span>
                    <span className="crm-body crm-mono text-[var(--crm-text)] text-[12px] sm:text-[13px]">{new Date(lead.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] px-3 py-2 items-center">
                    <span className="crm-meta text-[11px] sm:text-[12px]">Asignado a</span>
                    <Select
                      value={lead.ownerId || 'sin-asignar'}
                      onValueChange={(val) => {
                        const ownerId = val === 'sin-asignar' ? '' : val
                        doUpdate({ ownerId: ownerId || undefined })
                      }}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="h-7 text-[12px] border-[var(--crm-border)] rounded-[var(--crm-radius-md)]">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sin-asignar">Sin asignar</SelectItem>
                        {availableUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            <span className="flex items-center gap-1.5">
                              <span className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white', getOwnerColor(u.nombre))}>
                                {getOwnerInitial(u.nombre)}
                              </span>
                              {u.nombre}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Next task preview */}
              {tasksLoaded && pendingTasks.length > 0 && (
                <div className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border-light)] bg-[var(--crm-bg-subtle)] px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="crm-label">Próxima tarea</span>
                    <button onClick={() => setTab('tareas')} className="crm-meta hover:text-[var(--crm-text-secondary)] transition-colors">Ver todas →</button>
                  </div>
                  {(() => {
                    const nt = pendingTasks[0]
                    const overdue = isTaskOverdue(nt)
                    const typeInfo = TASK_TYPES.find((t) => t.id === nt.type)
                    return (
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{typeInfo?.emoji || '📋'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="crm-subtitle truncate">{nt.description}</p>
                          <p className={cn('crm-meta crm-mono mt-0.5', overdue && 'text-[var(--crm-danger)] font-medium')}>
                            {new Date(nt.dueDate).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
                            {overdue && ' · Vencida'}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Lost reason display */}
              {lead.stage === 'perdido' && lead.lostReason && (
                <div className="rounded-[var(--crm-radius-md)] border border-red-200 bg-[var(--crm-danger-light)] px-3 py-2.5">
                  <p className="crm-label text-[var(--crm-danger)]">Motivo de pérdida</p>
                  <p className="crm-subtitle mt-0.5">{lead.lostReason}</p>
                  {lead.lostNotes && <p className="crm-meta mt-1">{lead.lostNotes}</p>}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAREAS ═══ */}
          {tab === 'tareas' && (
            <div className="px-3 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="crm-label">Tareas pendientes ({pendingTasks.length})</span>
                <button onClick={() => setShowTaskForm(!showTaskForm)} className="crm-meta hover:text-[var(--crm-text-secondary)] flex items-center gap-1 transition-colors">
                  <Plus className="h-3 w-3" /> Nueva
                </button>
              </div>

              {showTaskForm && (
                <fieldset disabled={isUpdating} className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border)] bg-[var(--crm-bg-subtle)] p-3 space-y-2">
                  <div className="flex gap-2">
                    <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
                      <SelectTrigger className="h-8 w-[130px] text-[12px] border-[var(--crm-border)]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_TYPES.map((t) => <SelectItem key={t.id} value={t.id}><span>{t.emoji} {t.label}</span></SelectItem>)}
                      </SelectContent>
                    </Select>
                    <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="crm-input flex-1" aria-label="Fecha de la tarea" />
                  </div>
                  <input type="text" placeholder="Descripción…" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} className="crm-input w-full" aria-label="Descripción de la tarea" />
                  <input type="text" placeholder="Notas (opcional)" value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} className="crm-input w-full" aria-label="Notas de la tarea" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowTaskForm(false)} className="crm-btn-secondary text-[12px]">Cancelar</button>
                    <button onClick={handleAddTask} className="crm-btn-primary text-[12px] gap-1"><Plus className="h-3 w-3" /> Crear</button>
                  </div>
                </fieldset>
              )}

              {!tasksLoaded && (
                <div className="text-center py-6">
                  <div className="h-5 w-5 border-2 border-[var(--crm-border)] border-t-[var(--crm-primary)] rounded-full animate-spin mx-auto" />
                  <p className="crm-meta mt-2">Cargando tareas...</p>
                </div>
              )}

              {tasksLoaded && pendingTasks.length === 0 && !showTaskForm && (
                <div className="text-center py-6">
                  <CalendarCheck className="h-8 w-8 text-[var(--crm-text-muted)] mx-auto mb-2 opacity-40" />
                  <p className="crm-body">Sin tareas pendientes</p>
                  <button onClick={() => setShowTaskForm(true)} className="crm-meta hover:text-[var(--crm-text-secondary)] mt-2 transition-colors">+ Crear tarea</button>
                </div>
              )}

              <div className="space-y-1.5">
                {pendingTasks.map((task) => {
                  const overdue = isTaskOverdue(task)
                  const typeInfo = TASK_TYPES.find((t) => t.id === task.type)
                  return (
                    <div key={task.id} className={cn(
                      'flex items-start gap-2.5 rounded-[var(--crm-radius-md)] border px-3 py-2 group/task',
                      overdue ? 'border-red-200 bg-[var(--crm-danger-light)]' : 'border-[var(--crm-border-light)] bg-[var(--crm-bg-card)]'
                    )}>
                      <button onClick={() => handleCompleteTask(task.id)} disabled={isUpdating} className="mt-0.5 shrink-0 text-[var(--crm-text-muted)] hover:text-[var(--crm-success)] transition-colors">
                        <Square className="h-4 w-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px]">{typeInfo?.emoji}</span>
                          <p className="crm-subtitle truncate">{task.description}</p>
                          {overdue && <AlertCircle className="h-3 w-3 text-[var(--crm-danger)] shrink-0" />}
                        </div>
                        <p className={cn('crm-meta crm-mono mt-0.5', overdue && 'text-[var(--crm-danger)]')}>
                          {new Date(task.dueDate).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
                          {task.notes && ` · ${task.notes}`}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteTask(task.id)} disabled={isUpdating} className="opacity-100 sm:opacity-0 sm:group-hover/task:opacity-100 text-[var(--crm-text-muted)] hover:text-[var(--crm-danger)] transition-all shrink-0 mt-0.5">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>

              {doneTasks.length > 0 && (
                <>
                  <span className="crm-label block mt-4">Completadas ({doneTasks.length})</span>
                  <div className="space-y-1">
                    {doneTasks.slice(0, 5).map((task) => {
                      const typeInfo = TASK_TYPES.find((t) => t.id === task.type)
                      return (
                        <div key={task.id} className="flex items-center gap-2 px-3 py-1.5 opacity-50">
                          <CheckSquare className="h-3.5 w-3.5 text-[var(--crm-success)] shrink-0" />
                          <span className="text-[11px]">{typeInfo?.emoji}</span>
                          <p className="crm-meta line-through truncate">{task.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ TIMELINE ═══ */}
          {tab === 'timeline' && (
            <div className="px-3 sm:px-5 py-3 sm:py-4">
              <div className="flex items-start gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--crm-bg-subtle)] shrink-0 mt-0.5">
                  <Plus className="h-3.5 w-3.5 text-[var(--crm-text-muted)]" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Agregar nota…" rows={2} disabled={isUpdating} aria-label="Nueva nota" className="text-[13px] min-h-[60px] resize-none border-[var(--crm-border)] rounded-[var(--crm-radius-md)] focus:ring-2 focus:ring-[var(--crm-primary)]/5 focus:border-[var(--crm-border-focus)]" />
                  <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim() || isUpdating} className="crm-btn-primary h-7 text-[12px] gap-1">
                    <Send className="h-3 w-3" /> Agregar
                  </Button>
                </div>
              </div>

              {!activitiesLoaded && (
                <div className="text-center py-6">
                  <div className="h-5 w-5 border-2 border-[var(--crm-border)] border-t-[var(--crm-primary)] rounded-full animate-spin mx-auto" />
                  <p className="crm-meta mt-2">Cargando actividad...</p>
                </div>
              )}

              {activitiesLoaded && (
                <div className="relative">
                  <div className="absolute left-[13px] top-0 bottom-0 w-px bg-[var(--crm-border-light)]" />
                  <div className="space-y-0">
                    {timeline.map((entry) => {
                      const config = getTimelineIcon(entry.type)
                      const Icon = config.icon
                      return (
                        <div key={entry.id} className="relative flex items-start gap-3 py-2.5 group/entry">
                          <div className={cn('flex h-7 w-7 items-center justify-center rounded-full shrink-0 relative z-[1] transition-transform group-hover/entry:scale-110', config.bg)}>
                            <Icon className={cn('h-3.5 w-3.5', config.color)} />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="crm-body leading-snug">{entry.content}</p>
                            {entry.metadata?.userName && (
                              <p className="crm-meta text-[10px] mt-0.5">por {entry.metadata.userName}</p>
                            )}
                            <p className="crm-meta crm-mono mt-0.5">{formatRelativeDate(entry.date)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {timeline.length <= 1 && <div className="text-center py-6"><p className="crm-body">Sin actividad registrada</p></div>}
                </div>
              )}
            </div>
          )}

          {/* ═══ FICHA FASON ═══ */}
          {tab === 'ficha' && (
            <fieldset disabled={isUpdating} className="px-3 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-[var(--crm-text-muted)]" />
                <span className="crm-label">Ficha de producción</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="crm-label">Producto detallado</label>
                  <input type="text" value={ficha.productoDetalle || ''} onChange={(e) => setFicha({ ...ficha, productoDetalle: e.target.value })} placeholder="Ej: Alfajor triple chocolate 60g" className="crm-input w-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="crm-label">Volumen mensual</label>
                    <input type="text" value={ficha.volumenMensual || ''} onChange={(e) => setFicha({ ...ficha, volumenMensual: e.target.value })} placeholder="Ej: 5.000 unidades" className="crm-input w-full" />
                  </div>
                  <div className="space-y-1">
                    <label className="crm-label">Packaging</label>
                    <input type="text" value={ficha.packaging || ''} onChange={(e) => setFicha({ ...ficha, packaging: e.target.value })} placeholder="Ej: Flowpack individual" className="crm-input w-full" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="crm-label">Insumos del cliente</label>
                  <input type="text" value={ficha.insumoCliente || ''} onChange={(e) => setFicha({ ...ficha, insumoCliente: e.target.value })} placeholder="Ej: Provee chocolate, etiquetas" className="crm-input w-full" />
                </div>
                <div className="space-y-1">
                  <label className="crm-label">Fecha objetivo</label>
                  <input type="date" value={ficha.fechaObjetivo || ''} onChange={(e) => setFicha({ ...ficha, fechaObjetivo: e.target.value })} className="crm-input w-full" />
                </div>

                {/* Checklist */}
                <div className="space-y-1">
                  <label className="crm-label">Checklist de info mínima</label>
                  <div className="space-y-1.5 mt-1">
                    {([
                      ['fichaProducto', 'Ficha de producto completa'],
                      ['muestraAprobada', 'Muestra aprobada'],
                      ['precioAcordado', 'Precio acordado'],
                      ['arteFinal', 'Arte final recibido'],
                      ['logistica', 'Logística definida'],
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setFicha({ ...ficha, checklist: { ...ficha.checklist || { fichaProducto: false, muestraAprobada: false, precioAcordado: false, arteFinal: false, logistica: false }, [key]: !(ficha.checklist?.[key]) } })}
                        className="flex items-center gap-2 w-full text-left px-2 py-1 rounded-[var(--crm-radius-sm)] hover:bg-[var(--crm-bg-hover)] transition-colors"
                      >
                        {ficha.checklist?.[key]
                          ? <CheckSquare className="h-4 w-4 text-[var(--crm-success)] shrink-0" />
                          : <Square className="h-4 w-4 text-[var(--crm-text-muted)] shrink-0" />
                        }
                        <span className={cn('crm-body', ficha.checklist?.[key] && 'line-through text-[var(--crm-text-muted)]')}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveFicha} disabled={isUpdating} className="crm-btn-primary w-full gap-2 mt-2">
                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar ficha
              </Button>
            </fieldset>
          )}
        </div>

        {/* Lost reason dialog */}
        {showLostDialog && (
          <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30" role="dialog" aria-modal="true" aria-label="Motivo de pérdida">
            <div className="bg-[var(--crm-bg-card)] rounded-t-xl sm:rounded-xl w-full sm:max-w-sm p-5 space-y-3 shadow-xl m-0 sm:m-4">
              <h3 className="crm-title text-[15px]">Motivo de pérdida</h3>
              <p className="crm-body">¿Por qué se perdió este lead?</p>
              <Select value={lostReason} onValueChange={(v) => setLostReason(v as LostReason)}>
                <SelectTrigger className="h-9 text-[13px] border-[var(--crm-border)]"><SelectValue placeholder="Seleccioná un motivo…" /></SelectTrigger>
                <SelectContent>
                  {LOST_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea value={lostNotes} onChange={(e) => setLostNotes(e.target.value)} placeholder="Notas adicionales (opcional)" rows={2} className="text-[13px] resize-none border-[var(--crm-border)] rounded-[var(--crm-radius-md)]" />
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowLostDialog(false); setPendingStage(null) }} className="crm-btn-secondary flex-1">Cancelar</button>
                <button onClick={handleConfirmLost} disabled={!lostReason} className="crm-btn-primary flex-1 disabled:opacity-50">Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
