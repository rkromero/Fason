"use client"

import { useState, memo, useMemo } from 'react'
import { Lead, STAGES, getNextTask, isTaskOverdue, getOverdueTaskCount } from '@/lib/types/lead'
import { cn } from '@/lib/utils'
import { LeadDrawer } from './lead-drawer'
import {
  AlertCircle, CalendarCheck, Mail, MessageCircle, Phone,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronRight,
} from 'lucide-react'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

interface LeadsListViewProps {
  leads: Lead[]
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void
  onDeleteLead: (leadId: string) => void
}

type SortKey = 'nombre' | 'empresa' | 'stage' | 'owner' | 'monto' | 'nextTask' | 'updatedAt'
type SortDir = 'asc' | 'desc'

function getOwnerInitial(o?: string) { return o ? o.charAt(0).toUpperCase() : '?' }
const OC = ['bg-blue-600', 'bg-violet-600', 'bg-teal-600', 'bg-pink-600', 'bg-indigo-600', 'bg-orange-500', 'bg-emerald-600', 'bg-rose-500']
function getOwnerColor(o?: string) { if (!o) return 'bg-gray-400'; let h = 0; for (let i = 0; i < o.length; i++) h = o.charCodeAt(i) + ((h << 5) - h); return OC[Math.abs(h) % OC.length] }

function getPriorityDot(p?: string) {
  switch (p) {
    case 'A': return 'bg-[var(--crm-danger)]'
    case 'B': return 'bg-[var(--crm-warning)]'
    case 'C': return 'bg-[var(--crm-border)]'
    default: return 'bg-[var(--crm-border)]'
  }
}

function parseMonto(s?: string): number {
  if (!s) return 0
  return Number(s.replace(/[^0-9.]/g, '')) || 0
}

export const LeadsListView = memo(function LeadsListView({ leads, onUpdateLead, onDeleteLead }: LeadsListViewProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => [...leads].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'nombre': return dir * a.nombre.localeCompare(b.nombre)
      case 'empresa': return dir * a.empresa.localeCompare(b.empresa)
      case 'stage': {
        const aIdx = STAGES.findIndex((s) => s.id === a.stage)
        const bIdx = STAGES.findIndex((s) => s.id === b.stage)
        return dir * (aIdx - bIdx)
      }
      case 'owner': return dir * (a.owner || '').localeCompare(b.owner || '')
      case 'monto': return dir * (parseMonto(a.inversionEstimada) - parseMonto(b.inversionEstimada))
      case 'nextTask': {
        const aD = a.nextTaskDate ? new Date(a.nextTaskDate).getTime() : Infinity
        const bD = b.nextTaskDate ? new Date(b.nextTaskDate).getTime() : Infinity
        return dir * (aD - bD)
      }
      case 'updatedAt': return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      default: return 0
    }
  }), [leads, sortKey, sortDir])

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-[var(--crm-text-placeholder)]" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-[var(--crm-text)]" />
      : <ArrowDown className="h-3 w-3 text-[var(--crm-text)]" />
  }

  const handleWhatsApp = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation()
    let p = lead.telefono.replace(/[\s\-\(\)\+\.]/g, '').replace(/\D/g, '')
    if (!p || p.length < 8) return
    if (p.startsWith('0')) p = p.substring(1)
    if (!p.startsWith('54') && p.length <= 10) p = `54${p}`
    window.open(`https://wa.me/${p}`, '_blank')
  }

  return (
    <>
      {/* ─── Desktop table ─── */}
      <div className="hidden md:block crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--crm-border-light)] bg-[var(--crm-bg-subtle)]">
                {([
                  ['nombre', 'Nombre', true],
                  ['empresa', 'Empresa', true],
                  ['stage', 'Etapa', true],
                  ['owner', 'Owner', true],
                  ['monto', 'Monto', true],
                  ['nextTask', 'Próxima tarea', true],
                  ['updatedAt', 'Actualizado', true],
                  [null, 'Acciones', false],
                ] as const).map(([key, label, sortable], i) => (
                  <th
                    key={i}
                    className={cn(
                      'px-3 py-2.5 crm-label whitespace-nowrap',
                      sortable && 'cursor-pointer hover:text-[var(--crm-text-secondary)] select-none'
                    )}
                    onClick={() => sortable && key && toggleSort(key)}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {sortable && key && <SortIcon col={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((lead) => {
                const stageConfig = STAGES.find((s) => s.id === lead.stage)
                const nextTask = getNextTask(lead)
                const overdueCount = getOverdueTaskCount(lead)
                const taskOverdue = nextTask ? isTaskOverdue(nextTask) : false

                return (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={cn(
                      'border-b border-[var(--crm-border-light)] cursor-pointer',
                      'hover:bg-[var(--crm-bg-hover)] transition-colors',
                      overdueCount > 0 && 'bg-[var(--crm-danger-light)]/30'
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', getPriorityDot(lead.priority))} />
                        <span className="text-[13px] font-medium text-[var(--crm-text)] truncate max-w-[180px]">{lead.nombre}</span>
                        {overdueCount > 0 && (
                          <span className="flex items-center gap-0.5 crm-badge !px-1 !py-0 !text-[9px] !font-bold bg-[var(--crm-danger-light)] text-[var(--crm-danger)] shrink-0">
                            <AlertCircle className="h-2.5 w-2.5" />{overdueCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="crm-body truncate max-w-[140px] block">{lead.empresa}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn('crm-badge', stageConfig?.badge)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full mr-1', stageConfig?.dot)} />
                        {stageConfig?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0', getOwnerColor(lead.owner))}>
                          {getOwnerInitial(lead.owner)}
                        </span>
                        <span className="crm-meta truncate max-w-[80px]">{lead.owner || 'Sin asignar'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {lead.inversionEstimada ? (
                        <span className="text-[13px] font-medium text-[var(--crm-text)] crm-mono">${lead.inversionEstimada}</span>
                      ) : (
                        <span className="crm-meta">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {nextTask ? (
                        <span className={cn(
                          'inline-flex items-center gap-1 crm-badge !text-[10px]',
                          taskOverdue
                            ? 'bg-[var(--crm-danger-light)] text-[var(--crm-danger)]'
                            : 'bg-[var(--crm-warning-light)] text-[var(--crm-warning)]'
                        )}>
                          <CalendarCheck className="h-2.5 w-2.5" />
                          <span className="truncate max-w-[100px]">{nextTask.description}</span>
                          <span className="crm-mono">{new Date(nextTask.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                        </span>
                      ) : (
                        <span className="crm-meta">Sin tarea</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="crm-meta crm-mono whitespace-nowrap">
                        {new Date(lead.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={(e) => handleWhatsApp(e, lead)} className="h-6 w-6 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-success)] hover:bg-[var(--crm-success-light)] transition-colors">
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">WhatsApp</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${lead.email}` }} className="h-6 w-6 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-text-muted)] hover:bg-[var(--crm-bg-hover)] transition-colors">
                              <Mail className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Email</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.telefono}` }} className="h-6 w-6 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-text-muted)] hover:bg-[var(--crm-bg-hover)] transition-colors">
                              <Phone className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Llamar</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="crm-body">Sin leads para mostrar</p>
          </div>
        )}
      </div>

      {/* ─── Mobile card list ─── */}
      <div className="md:hidden space-y-2">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="crm-body">Sin leads para mostrar</p>
          </div>
        )}
        {sorted.map((lead) => {
          const stageConfig = STAGES.find((s) => s.id === lead.stage)
          const nextTask = getNextTask(lead)
          const overdueCount = getOverdueTaskCount(lead)
          const taskOverdue = nextTask ? isTaskOverdue(nextTask) : false

          return (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={cn(
                'crm-card px-3 py-3 cursor-pointer active:scale-[0.99] transition-all',
                overdueCount > 0 && 'border-l-2 border-l-[var(--crm-danger)]'
              )}
            >
              {/* Row 1: Name + Stage */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('h-2 w-2 rounded-full shrink-0', getPriorityDot(lead.priority))} />
                <span className="text-[13px] font-medium text-[var(--crm-text)] flex-1 truncate">{lead.nombre}</span>
                {overdueCount > 0 && (
                  <span className="flex items-center gap-0.5 crm-badge !px-1 !py-0 !text-[9px] !font-bold bg-[var(--crm-danger-light)] text-[var(--crm-danger)] shrink-0">
                    <AlertCircle className="h-2.5 w-2.5" />{overdueCount}
                  </span>
                )}
                <span className={cn('crm-badge !text-[10px]', stageConfig?.badge)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full mr-1', stageConfig?.dot)} />
                  {stageConfig?.label}
                </span>
              </div>

              {/* Row 2: Company + Owner */}
              <div className="flex items-center gap-2 mb-1.5 pl-4">
                <span className="text-[12px] text-[var(--crm-text-secondary)] flex-1 truncate">{lead.empresa}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white', getOwnerColor(lead.owner))}>
                    {getOwnerInitial(lead.owner)}
                  </span>
                  <span className="text-[11px] text-[var(--crm-text-muted)] truncate max-w-[60px]">{lead.owner || 'N/A'}</span>
                </div>
              </div>

              {/* Row 3: Monto + Next Task + Actions */}
              <div className="flex items-center gap-2 pl-4">
                {lead.inversionEstimada && (
                  <span className="text-[12px] font-medium text-[var(--crm-text)] crm-mono shrink-0">${lead.inversionEstimada}</span>
                )}
                {nextTask && (
                  <span className={cn(
                    'inline-flex items-center gap-0.5 crm-badge !text-[9px] !px-1.5',
                    taskOverdue
                      ? 'bg-[var(--crm-danger-light)] text-[var(--crm-danger)]'
                      : 'bg-[var(--crm-warning-light)] text-[var(--crm-warning)]'
                  )}>
                    <CalendarCheck className="h-2.5 w-2.5" />
                    <span className="truncate max-w-[80px]">{nextTask.description}</span>
                  </span>
                )}
                <div className="flex-1" />
                {/* Mobile quick actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={(e) => handleWhatsApp(e, lead)} className="h-7 w-7 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-success)] active:bg-[var(--crm-success-light)] transition-colors">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.telefono}` }} className="h-7 w-7 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-text-muted)] active:bg-[var(--crm-bg-hover)] transition-colors">
                    <Phone className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-[var(--crm-text-muted)]" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(open) => { if (!open) setSelectedLead(null) }}
          onUpdateLead={onUpdateLead}
        />
      )}
    </>
  )
})
