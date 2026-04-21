"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Lead,
  getNextTask,
  isTaskOverdue,
  getOverdueTaskCount,
  getLeadAgeDays,
  getLeadAgeLabel,
  getLeadAgeStyle,
  getPriorityStyle,
  getOwnerInitial,
  getOwnerColor,
  getProductoLabel,
  getVolumenLabel
} from '@/lib/types/lead'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Mail,
  Phone,
  MessageCircle,
  Eye,
  GripVertical,
  Clock,
  DollarSign,
  Building2,
  Trash2,
  AlertCircle,
  CalendarCheck,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn, formatWhatsAppUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { useState, useRef, useEffect, memo, useMemo } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { LeadDrawer } from './lead-drawer'
import type { DensityMode } from '@/lib/types/lead'

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void
  onDeleteLead?: (leadId: string) => void
  density?: DensityMode
}



export const LeadCard = memo(function LeadCard({ lead, isDragging, onUpdateLead, onDeleteLead, density = 'comfortable' }: LeadCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const isMobile = useIsMobile()
  const hasMovedRef = useRef(false)
  const clickStartTime = useRef<number | null>(null)
  const clickStartPos = useRef<{ x: number; y: number } | null>(null)
  const isCompact = density === 'compact'


  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.4 : 1,
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) return
    const touch = e.touches[0]
    clickStartTime.current = Date.now()
    clickStartPos.current = { x: touch.clientX, y: touch.clientY }
    hasMovedRef.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (clickStartPos.current && e.touches[0]) {
      const touch = e.touches[0]
      const distance = Math.sqrt(
        Math.pow(touch.clientX - clickStartPos.current.x, 2) +
        Math.pow(touch.clientY - clickStartPos.current.y, 2)
      )
      if (distance > 15) hasMovedRef.current = true
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
      clickStartTime.current = null
      clickStartPos.current = null
      return
    }
    const timeDiff = clickStartTime.current ? Date.now() - clickStartTime.current : 0
    const touch = e.changedTouches[0]
    const posDiff = clickStartPos.current
      ? { x: Math.abs(touch.clientX - clickStartPos.current.x), y: Math.abs(touch.clientY - clickStartPos.current.y) }
      : { x: 0, y: 0 }
    const isTap = !hasMovedRef.current && !isSortableDragging && !isDragging && timeDiff < 600 && posDiff.x < 25 && posDiff.y < 25
    if (isTap) {
      e.preventDefault()
      e.stopPropagation()
      setIsDialogOpen(true)
    }
    clickStartTime.current = null
    clickStartPos.current = null
    hasMovedRef.current = false
  }

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = formatWhatsAppUrl(lead.telefono)
    if (!url) {
      toast.error('Número de teléfono inválido')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const openCard = () => {
    if (!isSortableDragging && !isDragging) setIsDialogOpen(true)
  }

  const priority = useMemo(() => getPriorityStyle(lead.priority), [lead.priority])
  const ageDays = useMemo(() => getLeadAgeDays(lead.createdAt), [lead.createdAt])
  const nextTask = useMemo(() => getNextTask(lead), [lead])
  const overdueCount = useMemo(() => getOverdueTaskCount(lead), [lead])
  const nextTaskIsOverdue = nextTask ? isTaskOverdue(nextTask) : false

  return (
    <>
      <div ref={setNodeRef} style={style} className="w-full" role="article" aria-label={`Lead: ${lead.nombre} — ${lead.empresa}`}>
        <div
          className={cn(
            'group relative rounded-[var(--crm-radius-md)] border bg-[var(--crm-bg-card)]',
            'cursor-pointer select-none touch-manipulation',
            'transition-all duration-[var(--crm-transition)]',
            'hover:border-[var(--crm-border-hover)] hover:shadow-[var(--crm-shadow-md)] hover:-translate-y-[1px]',
            'active:scale-[0.99] active:translate-y-0',
            isCompact ? 'px-2.5 py-2 border-[var(--crm-border-light)]' : 'px-3 py-2.5 border-[var(--crm-border)]',
            (isDragging || isSortableDragging) && 'shadow-[var(--crm-shadow-drag)] scale-[1.02] opacity-80 border-[var(--crm-border-hover)] rotate-1',
            overdueCount > 0 && !isDragging && 'border-l-2 border-l-[var(--crm-danger)]'
          )}
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.closest('button') || target.closest('a') || target.closest('[role="button"]') || target.closest('[data-drag-handle]')) return
            openCard()
          }}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          {/* Row 1: Priority dot + Name + Age + Actions */}
          <div className="flex items-center gap-2 mb-1">
            {!isMobile && (
              <div
                data-drag-handle
                role="button"
                aria-label={`Mover lead ${lead.nombre}`}
                tabIndex={0}
                className="cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity -ml-1"
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3.5 w-3.5 text-[var(--crm-text-muted)]" />
              </div>
            )}

            <span
              className={cn('h-2 w-2 rounded-full shrink-0', priority.cls)}
              title={`Prioridad ${priority.label}`}
            />

            <span className={cn(
              'flex-1 font-medium text-[var(--crm-text)] truncate leading-tight',
              isCompact ? 'text-[12px]' : 'text-[13px]'
            )}>
              {lead.nombre}
            </span>

            {/* Overdue indicator */}
            {overdueCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-0.5 crm-badge !px-1.5 !py-0 !text-[9px] !font-bold bg-[var(--crm-danger-light)] text-[var(--crm-danger)] shrink-0">
                    <AlertCircle className="h-2.5 w-2.5" />
                    {overdueCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{overdueCount} tarea{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}</TooltipContent>
              </Tooltip>
            )}

            <span className={cn(
              'crm-badge !px-1.5 !py-0 !text-[10px] !font-semibold crm-mono shrink-0',
              getLeadAgeStyle(ageDays)
            )}>
              {getLeadAgeLabel(ageDays)}
            </span>

            {/* Icon quick actions (always visible on mobile, hover on desktop) */}
            <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleWhatsAppClick}
                    className="h-5 w-5 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-success)] hover:bg-[var(--crm-success-light)] transition-colors"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">WhatsApp</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${lead.email}` }}
                    className="h-5 w-5 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-text-muted)] hover:bg-[var(--crm-bg-hover)] hover:text-[var(--crm-text-secondary)] transition-colors"
                  >
                    <Mail className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Email</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.telefono}` }}
                    className="h-5 w-5 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-text-muted)] hover:bg-[var(--crm-bg-hover)] hover:text-[var(--crm-text-secondary)] transition-colors"
                  >
                    <Phone className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Llamar</TooltipContent>
              </Tooltip>
            </div>

            {/* "..." menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6 shrink-0 rounded-[var(--crm-radius-sm)]',
                    'md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100',
                    'transition-opacity hover:bg-[var(--crm-bg-hover)]'
                  )}
                >
                  <MoreHorizontal className="h-3.5 w-3.5 text-[var(--crm-text-muted)]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="w-44 bg-white border border-[var(--crm-border)] shadow-lg">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true) }}>
                  <Eye className="h-3.5 w-3.5 mr-2" />
                  Ver detalles
                </DropdownMenuItem>
                {onDeleteLead && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true) }}
                      className="text-[var(--crm-danger)] focus:text-[var(--crm-danger)] focus:bg-[var(--crm-danger-light)]"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Row 2: Company */}
          {!isCompact && (
            <div className="flex items-center gap-1.5 mb-2 pl-4">
              <Building2 className="h-3 w-3 text-[var(--crm-text-muted)] shrink-0" />
              <span className="text-[12px] text-[var(--crm-text-secondary)] truncate">{lead.empresa}</span>
            </div>
          )}

          {/* Row 3: Metadata badges + amount */}
          <div className={cn('flex items-center gap-1.5 flex-wrap', isCompact ? 'pl-4 mt-1' : 'pl-4')}>
            {isCompact ? (
              <>
                {lead.inversionEstimada && (
                  <span className="crm-badge bg-[var(--crm-success-light)] text-[var(--crm-success)]">
                    <DollarSign className="h-3 w-3 mr-0.5" />
                    <span className="crm-mono">{lead.inversionEstimada}</span>
                  </span>
                )}
                <span className="crm-badge bg-[var(--crm-bg-subtle)] text-[var(--crm-text-muted)]">
                  {getProductoLabel(lead.producto)}
                </span>
              </>
            ) : (
              <>
                <span className="crm-badge bg-[var(--crm-bg-subtle)] text-[var(--crm-text-secondary)]">
                  {getProductoLabel(lead.producto)}
                </span>
                <span className="crm-badge bg-[var(--crm-bg-subtle)] text-[var(--crm-text-muted)]">
                  {getVolumenLabel(lead.volumen)}
                </span>
                {lead.inversionEstimada && (
                  <span className="crm-badge bg-[var(--crm-success-light)] text-[var(--crm-success)]">
                    <DollarSign className="h-3 w-3 mr-0.5" />
                    <span className="crm-mono">{lead.inversionEstimada}</span>
                  </span>
                )}
              </>
            )}
          </div>

          {/* Row 4: Next task chip */}
          {nextTask && (
            <div className={cn('pl-4', isCompact ? 'mt-1.5' : 'mt-2')}>
              <span className={cn(
                'inline-flex items-center gap-1 crm-badge !text-[10px]',
                nextTaskIsOverdue
                  ? 'bg-[var(--crm-danger-light)] text-[var(--crm-danger)]'
                  : 'bg-[var(--crm-warning-light)] text-[var(--crm-warning)]'
              )}>
                <CalendarCheck className="h-2.5 w-2.5" />
                <span className="truncate max-w-[120px]">{nextTask.description}</span>
                <span className="crm-mono">
                  {new Date(nextTask.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </span>
              </span>
            </div>
          )}

          {/* Row 5: Owner + last contact */}
          <div className={cn(
            'flex items-center justify-between border-t border-[var(--crm-border-light)] pl-4',
            isCompact ? 'mt-1.5 pt-1.5' : 'mt-2 pt-2'
          )}>
            <div className="flex items-center gap-1.5" title={lead.owner || 'Sin asignar'}>
              <span className={cn(
                'flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0',
                isCompact ? 'h-4 w-4' : 'h-4.5 w-4.5',
                getOwnerColor(lead.owner)
              )}>
                {getOwnerInitial(lead.owner)}
              </span>
              <span className="text-[11px] text-[var(--crm-text-muted)] truncate max-w-[72px]">
                {lead.owner || 'Sin asignar'}
              </span>
            </div>
            {lead.lastContact && (
              <span className="text-[10px] text-[var(--crm-text-muted)] flex items-center gap-1 crm-mono">
                <Clock className="h-2.5 w-2.5" />
                {new Date(lead.lastContact).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      </div>

      <LeadDrawer
        lead={lead}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUpdateLead={onUpdateLead}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar lead</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés eliminar a <span className="font-semibold text-[var(--crm-text)]">{lead.nombre}</span> de <span className="font-semibold text-[var(--crm-text)]">{lead.empresa}</span>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDeleteLead?.(lead.id)}
              className="bg-[var(--crm-danger)] text-white hover:bg-red-700 text-sm"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
