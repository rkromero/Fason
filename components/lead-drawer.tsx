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
  ExternalLink,
  PhoneCall,
  MailOpen,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────
interface LeadDrawerProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void
}

// ─── Mock timeline builder ──────────────────────────────────────
interface TimelineEntry {
  id: string
  type: 'note' | 'call' | 'email' | 'whatsapp' | 'stage-change' | 'created'
  date: string
  content: string
}

function buildTimeline(lead: Lead): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  // Created
  entries.push({
    id: 'created',
    type: 'created',
    date: lead.createdAt,
    content: 'Lead creado',
  })

  // Notes as timeline entries
  if (lead.notes && lead.notes.length > 0) {
    lead.notes.forEach((note, i) => {
      const offsetDays = (i + 1) * 2
      const noteDate = new Date(new Date(lead.createdAt).getTime() + offsetDays * 24 * 60 * 60 * 1000)
      entries.push({
        id: `note-${i}`,
        type: 'note',
        date: noteDate.toISOString(),
        content: note,
      })
    })
  }

  // Mock activities based on lastContact
  if (lead.lastContact) {
    entries.push({
      id: 'last-call',
      type: 'call',
      date: lead.lastContact,
      content: 'Llamada de seguimiento realizada',
    })
  }

  // Mock first contact activity
  if (lead.firstContactDate && lead.firstContactDate !== lead.createdAt) {
    entries.push({
      id: 'first-contact',
      type: 'email',
      date: lead.firstContactDate,
      content: 'Primer contacto por email',
    })
  }

  // Sort desc
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return entries
}

function getTimelineIcon(type: TimelineEntry['type']) {
  switch (type) {
    case 'note': return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' }
    case 'call': return { icon: PhoneCall, color: 'text-blue-600', bg: 'bg-blue-50' }
    case 'email': return { icon: MailOpen, color: 'text-violet-600', bg: 'bg-violet-50' }
    case 'whatsapp': return { icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' }
    case 'stage-change': return { icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-50' }
    case 'created': return { icon: Plus, color: 'text-gray-400', bg: 'bg-gray-50' }
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

// ─── Component ──────────────────────────────────────────────────
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
      if (onUpdateLead) {
        await onUpdateLead(lead.id, { stage: newStage })
      }
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
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden"
      >
        {/* ─── Header ──────────────────────────────────── */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start gap-3">
            {/* Owner avatar */}
            <span className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shrink-0 mt-0.5',
              getOwnerColor(lead.owner)
            )}>
              {getOwnerInitial(lead.owner)}
            </span>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-[15px] font-semibold text-gray-900 truncate">
                {lead.nombre}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-0.5">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.empresa}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ─── Scrollable content ──────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* Summary section */}
          <div className="px-5 py-4 space-y-3">
            {/* Stage selector */}
            <div className="flex items-center justify-between">
              <span className="crm-label">Etapa</span>
              <Select value={currentStage} onValueChange={handleStageChange} disabled={isUpdating}>
                <SelectTrigger className="h-7 w-auto gap-1.5 text-[12px] font-medium border-gray-200 rounded-md px-2.5">
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
              <div className="rounded-md border border-gray-100 bg-gray-50/50 px-3 py-2">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Contacto</p>
                <p className="text-[13px] text-gray-700 truncate mt-0.5">{lead.email}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{lead.telefono}</p>
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50/50 px-3 py-2">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Inversión</p>
                <p className="text-[15px] font-semibold text-gray-900 mt-0.5">
                  {lead.inversionEstimada || '—'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{ageDays}d en pipeline</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="crm-badge bg-gray-100 text-gray-600">
                {lead.producto === 'alfajores' ? 'Alfajores' : 'Galletitas'}
              </span>
              <span className="crm-badge bg-gray-100 text-gray-500">
                {lead.volumen === 'menos-1000' ? '<1K' : lead.volumen === '1000-5000' ? '1-5K' : '>5K'}/mes
              </span>
              {lead.owner && (
                <span className="crm-badge bg-gray-100 text-gray-500">
                  {lead.owner}
                </span>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[12px] gap-1.5 rounded-md border-gray-200 text-gray-600"
                onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
              >
                <Mail className="h-3 w-3" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[12px] gap-1.5 rounded-md border-gray-200 text-gray-600"
                onClick={() => window.open(`tel:${lead.telefono}`, '_blank')}
              >
                <Phone className="h-3 w-3" />
                Llamar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[12px] gap-1.5 rounded-md border-gray-200 text-emerald-600 hover:bg-emerald-50"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* ─── Next task ───────────────────────────────── */}
          <div className="px-5 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="crm-label">Próxima tarea</span>
              {!isEditingTask ? (
                <button
                  onClick={() => setIsEditingTask(true)}
                  className="text-[11px] font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setIsEditingTask(false); setTaskDescription(lead.nextTaskDescription || ''); setTaskDate(lead.nextTaskDate || '') }}
                    className="h-6 w-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleSaveTask}
                    disabled={isUpdating}
                    className="h-6 w-6 flex items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
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
                  className="crm-input w-full"
                />
                <input
                  type="date"
                  value={taskDate ? taskDate.split('T')[0] : ''}
                  onChange={(e) => setTaskDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="crm-input w-full"
                />
              </div>
            ) : (
              <div className="rounded-md border border-gray-100 bg-gray-50/50 px-3 py-2.5">
                {lead.nextTaskDescription ? (
                  <div className="flex items-start gap-2">
                    <CalendarCheck className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] text-gray-700 font-medium">{lead.nextTaskDescription}</p>
                      {lead.nextTaskDate && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(lead.nextTaskDate).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
                          {new Date(lead.nextTaskDate) < new Date() && (
                            <span className="text-red-500 font-medium ml-1.5">Vencida</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-gray-400 italic">Sin tarea programada</p>
                )}
              </div>
            )}
          </div>

          {/* ─── Activity timeline ────────────────────────── */}
          <div className="px-5 py-3 border-t border-gray-100">
            <span className="crm-label block mb-3">Actividad</span>

            {/* Add note */}
            <div className="flex items-start gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 shrink-0 mt-0.5">
                <Plus className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Agregar nota…"
                  rows={2}
                  className="text-[13px] min-h-[60px] resize-none border-gray-200 rounded-md focus:ring-2 focus:ring-gray-900/5 focus:border-gray-300"
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

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[13px] top-0 bottom-0 w-px bg-gray-100" />

              <div className="space-y-0">
                {timeline.map((entry, idx) => {
                  const config = getTimelineIcon(entry.type)
                  const Icon = config.icon
                  return (
                    <div key={entry.id} className="relative flex items-start gap-3 py-2.5">
                      {/* Icon */}
                      <div className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full shrink-0 relative z-[1]',
                        config.bg
                      )}>
                        <Icon className={cn('h-3.5 w-3.5', config.color)} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[13px] text-gray-700 leading-snug">{entry.content}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">{formatRelativeDate(entry.date)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {timeline.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-[13px] text-gray-400">Sin actividad registrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
