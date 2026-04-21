"use client"

import { useState, memo, useMemo } from 'react'
import { Lead, STAGES, getNextTask, isTaskOverdue, getOverdueTaskCount } from '@/lib/types/lead'
import { cn } from '@/lib/utils'
import { LeadDrawer } from './lead-drawer'
import {
  MessageCircle, Phone, ChevronRight, AlertCircle, CalendarCheck, DollarSign,
} from 'lucide-react'

interface MobileLeadCardProps {
  lead: Lead
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void
  onDeleteLead?: (leadId: string) => void
}

function getPriorityColor(p?: string) {
  switch (p) {
    case 'A': return 'bg-[var(--crm-danger)]'
    case 'B': return 'bg-[var(--crm-warning)]'
    default: return 'bg-[var(--crm-border)]'
  }
}

function getOwnerInitial(o?: string) { return o ? o.charAt(0).toUpperCase() : '?' }
const COLORS = ['bg-blue-600', 'bg-violet-600', 'bg-teal-600', 'bg-pink-600', 'bg-indigo-600', 'bg-orange-500', 'bg-emerald-600', 'bg-rose-500']
function getOwnerColor(o?: string) { if (!o) return 'bg-gray-400'; let h = 0; for (let i = 0; i < o.length; i++) h = o.charCodeAt(i) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length] }

function getAgeBadge(createdAt: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000))
  if (days === 0) return { label: 'Hoy', cls: 'text-[var(--crm-success)] bg-[var(--crm-success-light)]' }
  if (days < 7) return { label: `${days}d`, cls: 'text-[var(--crm-success)] bg-[var(--crm-success-light)]' }
  if (days < 14) return { label: `${days}d`, cls: 'text-[var(--crm-warning)] bg-[var(--crm-warning-light)]' }
  const w = Math.floor(days / 7)
  return { label: `${w}sem`, cls: 'text-[var(--crm-danger)] bg-[var(--crm-danger-light)]' }
}

export const MobileLeadCard = memo(function MobileLeadCard({ lead, onUpdateLead, onDeleteLead }: MobileLeadCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const nextTask = useMemo(() => getNextTask(lead), [lead])
  const overdueCount = useMemo(() => getOverdueTaskCount(lead), [lead])
  const taskOverdue = nextTask ? isTaskOverdue(nextTask) : false
  const age = useMemo(() => getAgeBadge(lead.createdAt), [lead.createdAt])

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    let p = lead.telefono.replace(/[\s\-\(\)\+\.]/g, '').replace(/\D/g, '')
    if (!p || p.length < 8) return
    if (p.startsWith('0')) p = p.substring(1)
    if (!p.startsWith('54') && p.length <= 10) p = `54${p}`
    window.open(`https://wa.me/${p}`, '_blank')
  }

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = `tel:${lead.telefono}`
  }

  return (
    <>
      <div
        onClick={() => setDrawerOpen(true)}
        className={cn(
          'rounded-xl border bg-[var(--crm-bg-card)] px-3 py-2.5 active:scale-[0.98] transition-all',
          'cursor-pointer select-none',
          overdueCount > 0 ? 'border-l-[3px] border-l-[var(--crm-danger)] border-[var(--crm-border-light)]' : 'border-[var(--crm-border-light)]'
        )}
      >
        {/* Row 1: Name + age + overdue */}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('h-2 w-2 rounded-full shrink-0', getPriorityColor(lead.priority))} />
          <span className="flex-1 text-[13px] font-semibold text-[var(--crm-text)] truncate leading-tight">
            {lead.nombre}
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[var(--crm-danger-light)] text-[var(--crm-danger)] shrink-0">
              <AlertCircle className="h-2.5 w-2.5" />
              {overdueCount}
            </span>
          )}
          <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0', age.cls)}>
            {age.label}
          </span>
        </div>

        {/* Row 2: Company + amount */}
        <div className="flex items-center gap-2 mb-1.5 pl-4">
          <span className="text-[12px] text-[var(--crm-text-secondary)] truncate flex-1">{lead.empresa}</span>
          {lead.inversionEstimada && (
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-[var(--crm-success)] shrink-0">
              <DollarSign className="h-3 w-3" />
              <span className="crm-mono">{lead.inversionEstimada}</span>
            </span>
          )}
        </div>

        {/* Row 3: Task + Owner + Quick actions */}
        <div className="flex items-center gap-1.5 pl-4">
          {nextTask ? (
            <span className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
              taskOverdue
                ? 'bg-[var(--crm-danger-light)] text-[var(--crm-danger)]'
                : 'bg-[var(--crm-warning-light)] text-[var(--crm-warning)]'
            )}>
              <CalendarCheck className="h-2.5 w-2.5" />
              <span className="truncate max-w-[80px]">{nextTask.description}</span>
            </span>
          ) : (
            <span className="text-[10px] text-[var(--crm-text-muted)]">Sin tarea</span>
          )}

          <div className="flex-1" />

          {/* Owner */}
          <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white shrink-0', getOwnerColor(lead.owner))}>
            {getOwnerInitial(lead.owner)}
          </span>

          {/* Quick actions */}
          <button
            onClick={handleWhatsApp}
            className="h-8 w-8 flex items-center justify-center rounded-full text-[var(--crm-success)] active:bg-[var(--crm-success-light)] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            onClick={handleCall}
            className="h-8 w-8 flex items-center justify-center rounded-full text-[var(--crm-text-muted)] active:bg-[var(--crm-bg-hover)] transition-colors"
          >
            <Phone className="h-4 w-4" />
          </button>
          <ChevronRight className="h-4 w-4 text-[var(--crm-border)] shrink-0" />
        </div>
      </div>

      <LeadDrawer
        lead={lead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdateLead={onUpdateLead}
      />
    </>
  )
})
