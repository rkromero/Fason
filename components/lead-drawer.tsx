"use client"

import { useState, useEffect, useMemo } from 'react'
import { Lead, LeadStage, STAGES } from '@/lib/types/lead'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Mail,
  Phone,
  Building2,
  DollarSign,
  Clock,
  MessageCircle,
  Send,
  CalendarCheck,
  FileText,
  Plus,
  Pencil,
  Check,
  X,
  PhoneCall,
  MailOpen,
} from 'lucide-react'

interface LeadDrawerProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void
}

interface TimelineEntry {
  id: string
  type: 'note' | 'call' | 'email' | 'whatsapp' | 'stage-change' | 'created'
  date: string
  content: string
}

function buildTimeline(lead: Lead): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  entries.push({ id: 'created', type: 'created', date: lead.createdAt, content: 'Lead creado' })

  if (lead.notes && lead.notes.length > 0) {
    lead.notes.forEach((note, i) => {
      const offsetDays = (i + 1) * 2
      const noteDate = new Date(new Date(lead.createdAt).getTime() + offsetDays * 24 * 60 * 60 * 1000)
      entries.push({ id: `note-${i}`, type: 'note', date: noteDate.toISOString(), content: note })
    })
  }

  if (lead.lastContact) {
    entries.push({ id: 'last-call', type: 'call', date: lead.lastContact, content: 'Llamada de seguimiento realizada' })
  }

  if (lead.firstContactDate && lead.firstContactDate !== lead.createdAt) {
    entries.push({ id: 'first-contact', type: 'email', date: lead.firstContactDate, content: 'Primer contacto por email' })
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return entries
}

function getTimelineIcon(type: TimelineEntry['type']) {
  switch (type) {
    case 'note': return { icon: FileText, color: 'text-[var(--crm-text-muted)]', bg: 'bg-[var(--crm-bg-subtle)]' }
    case 'call': return { icon: PhoneCall, color: 'text-[var(--crm-info)]', bg: 'bg-[var(--crm-info-light)]' }
    case 'email': return { icon: MailOpen, color: 'text-violet-600', bg: 'bg-violet-50' }
    case 'whatsapp': return { icon: MessageCircle, color: 'text-[var(--crm-success)]', bg: 'bg-[var(--crm-success-light)]' }
    case 'stage-change': return { icon: CalendarCheck, color: 'text-[var(--crm-warning)]', bg: 'bg-[var(--crm-warning-light)]' }
    case 'created': return { icon: Plus, color: 'text-[var(--crm-text-muted)]', bg: 'bg-[var(--crm-bg-muted)]' }
  }
}

function formatRelativeDate(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}min`
  if (diffH < 24) return `Hace ${diffH}h`
  if (diffD === 1) return 'Ayer'
  if (diffD < 7) return `Hace ${diffD}d`
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

function getOwnerInitial(owner?: string): string {
  if (!owner) return '?'
  return owner.charAt(0).toUpperCase()
}

const OWNER_COLORS = [
  'bg-blue-600', 'bg-violet-600', 'bg-teal-600', 'bg-pink-600',
  'bg-indigo-600', 'bg-orange-500', 'bg-emerald-600', 'bg-rose-500',
]

function getOwnerColor(owner?: string): string {
  if (!owner) return 'bg-gray-400'
  let hash = 0
  for (let i = 0; i < owner.length; i++) {
    hash = owner.charCodeAt(i) + ((hash << 5) - hash)
  }
  return OWNER_COLORS[Math.abs(hash) % OWNER_COLORS.length]
}

function getLeadAgeDays(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
}

export function LeadDrawer({ lead, open, onOpenChange, onUpdateLead }: LeadDrawerProps) {
  const [currentStage, setCurrentStage] = useState<LeadStage>(lead.stage)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [taskDescription, setTaskDescription] = useState(lead.nextTaskDescription || '')
  const [taskDate, setTaskDate] = useState(lead.nextTaskDate || '')

  const timeline = useMemo(() => buildTimeline(lead), [lead])

  useEffect(() => {
    setCurrentStage(lead.stage)
    setTaskDescription(lead.nextTaskDescription || '')
    setTaskDate(lead.nextTaskDate || '')
  }, [lead])

  const handleStageChange = async (newStage: LeadStage) => {
    if (newStage === lead.stage) return
    setCurrentStage(newStage)
    setIsUpdating(true)
    try {
      if (onUpdateLead) await onUpdateLead(lead.id, { stage: newStage })
    } catch {
      toast.error('Error al actualizar')
      setCurrentStage(lead.stage)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    const updatedNotes = [...(lead.notes || []), newNote.trim()]
    setIsUpdating(true)
    try {
      if (onUpdateLead) {
        await onUpdateLead(lead.id, { notes: updatedNotes })
        setNewNote('')
      }
    } catch {
      toast.error('Error al agregar nota')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveTask = async () => {
    setIsUpdating(true)
    try {
      if (onUpdateLead) {
        await onUpdateLead(lead.id, {
          nextTaskDescription: taskDescription || undefined,
          nextTaskDate: taskDate || undefined,
        })
        setIsEditingTask(false)
      }
    } catch {
      toast.error('Error al guardar tarea')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleWhatsAppClick = () => {
    let cleanPhone = lead.telefono.replace(/[\s\-\(\)\+\.]/g, '').replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 8) { toast.error('Teléfono inválido'); return }
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1)
    if (!cleanPhone.startsWith('54') && cleanPhone.length <= 10) cleanPhone = `54${cleanPhone}`
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  const stageConfig = STAGES.find((s) => s.id === currentStage)
  const ageDays = getLeadAgeDays(lead.createdAt)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-[var(--crm-border-light)] shrink-0">
          <div className="flex items-start gap-3">
            <span className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shrink-0 mt-0.5',
              getOwnerColor(lead.owner)
            )}>
              {getOwnerInitial(lead.owner)}
            </span>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-[15px] font-semibold text-[var(--crm-text)] truncate">
                {lead.nombre}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 text-[13px] text-[var(--crm-text-secondary)] mt-0.5">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.empresa}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-3">
            {/* Stage selector */}
            <div className="flex items-center justify-between">
              <span className="crm-label">Etapa</span>
              <Select value={currentStage} onValueChange={handleStageChange} disabled={isUpdating}>
                <SelectTrigger className="h-7 w-auto gap-1.5 text-[12px] font-medium border-[var(--crm-border)] rounded-[var(--crm-radius-md)] px-2.5">
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

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border-light)] bg-[var(--crm-bg-subtle)] px-3 py-2">
                <p className="crm-label">Contacto</p>
                <p className="crm-body truncate mt-0.5">{lead.email}</p>
                <p className="crm-meta mt-0.5">{lead.telefono}</p>
              </div>
              <div className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border-light)] bg-[var(--crm-bg-subtle)] px-3 py-2">
                <p className="crm-label">Inversión</p>
                <p className="text-[15px] font-semibold text-[var(--crm-text)] crm-mono mt-0.5">
                  {lead.inversionEstimada || '—'}
                </p>
                <p className="crm-meta crm-mono mt-0.5">{ageDays}d en pipeline</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="crm-badge bg-[var(--crm-bg-subtle)] text-[var(--crm-text-secondary)]">
                {lead.producto === 'alfajores' ? 'Alfajores' : 'Galletitas'}
              </span>
              <span className="crm-badge bg-[var(--crm-bg-subtle)] text-[var(--crm-text-muted)]">
                {lead.volumen === 'menos-1000' ? '<1K' : lead.volumen === '1000-5000' ? '1-5K' : '>5K'}/mes
              </span>
              {lead.owner && (
                <span className="crm-badge bg-[var(--crm-bg-subtle)] text-[var(--crm-text-muted)]">
                  {lead.owner}
                </span>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[12px] gap-1.5 rounded-[var(--crm-radius-md)] border-[var(--crm-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)] crm-focus-ring"
                onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
              >
                <Mail className="h-3 w-3" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[12px] gap-1.5 rounded-[var(--crm-radius-md)] border-[var(--crm-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)] crm-focus-ring"
                onClick={() => window.open(`tel:${lead.telefono}`, '_blank')}
              >
                <Phone className="h-3 w-3" />
                Llamar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[12px] gap-1.5 rounded-[var(--crm-radius-md)] border-[var(--crm-border)] text-[var(--crm-success)] hover:bg-[var(--crm-success-light)] crm-focus-ring"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Next task */}
          <div className="px-5 py-3 border-t border-[var(--crm-border-light)]">
            <div className="flex items-center justify-between mb-2">
              <span className="crm-label">Próxima tarea</span>
              {!isEditingTask ? (
                <button
                  onClick={() => setIsEditingTask(true)}
                  className="crm-meta hover:text-[var(--crm-text-secondary)] flex items-center gap-1 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setIsEditingTask(false); setTaskDescription(lead.nextTaskDescription || ''); setTaskDate(lead.nextTaskDate || '') }}
                    className="h-6 w-6 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleSaveTask}
                    disabled={isUpdating}
                    className="h-6 w-6 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-success)] hover:bg-[var(--crm-success-light)] transition-colors disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {isEditingTask ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Descripción de la tarea…"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="crm-input w-full crm-focus-ring"
                />
                <input
                  type="date"
                  value={taskDate ? taskDate.split('T')[0] : ''}
                  onChange={(e) => setTaskDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="crm-input w-full crm-focus-ring"
                />
              </div>
            ) : (
              <div className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border-light)] bg-[var(--crm-bg-subtle)] px-3 py-2.5">
                {lead.nextTaskDescription ? (
                  <div className="flex items-start gap-2">
                    <CalendarCheck className="h-3.5 w-3.5 text-[var(--crm-warning)] shrink-0 mt-0.5" />
                    <div>
                      <p className="crm-subtitle">{lead.nextTaskDescription}</p>
                      {lead.nextTaskDate && (
                        <p className="crm-meta crm-mono mt-0.5">
                          {new Date(lead.nextTaskDate).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
                          {new Date(lead.nextTaskDate) < new Date() && (
                            <span className="text-[var(--crm-danger)] font-medium ml-1.5">Vencida</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="crm-meta italic">Sin tarea programada</p>
                )}
              </div>
            )}
          </div>

          {/* Activity timeline */}
          <div className="px-5 py-3 border-t border-[var(--crm-border-light)]">
            <span className="crm-label block mb-3">Actividad</span>

            <div className="flex items-start gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--crm-bg-subtle)] shrink-0 mt-0.5">
                <Plus className="h-3.5 w-3.5 text-[var(--crm-text-muted)]" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Agregar nota…"
                  rows={2}
                  className="text-[13px] min-h-[60px] resize-none border-[var(--crm-border)] rounded-[var(--crm-radius-md)] focus:ring-2 focus:ring-[var(--crm-primary)]/5 focus:border-[var(--crm-border-focus)]"
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || isUpdating}
                  className="crm-btn-primary h-7 text-[12px] gap-1"
                >
                  <Send className="h-3 w-3" />
                  Agregar
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-[13px] top-0 bottom-0 w-px bg-[var(--crm-border-light)]" />

              <div className="space-y-0">
                {timeline.map((entry) => {
                  const config = getTimelineIcon(entry.type)
                  const Icon = config.icon
                  return (
                    <div key={entry.id} className="relative flex items-start gap-3 py-2.5 group/entry">
                      <div className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full shrink-0 relative z-[1]',
                        'transition-transform group-hover/entry:scale-110',
                        config.bg
                      )}>
                        <Icon className={cn('h-3.5 w-3.5', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="crm-body leading-snug">{entry.content}</p>
                        <p className="crm-meta crm-mono mt-0.5">{formatRelativeDate(entry.date)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {timeline.length === 0 && (
                <div className="text-center py-6">
                  <p className="crm-body">Sin actividad registrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
