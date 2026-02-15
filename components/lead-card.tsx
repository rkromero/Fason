"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Lead } from '@/lib/types/lead'
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
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { LeadDetailsDialog } from './lead-details-dialog'

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void
  onDeleteLead?: (leadId: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────
function getLeadAgeDays(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
}

function getLeadAgeLabel(days: number): string {
  if (days === 0) return 'Hoy'
  if (days === 1) return '1d'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}sem`
  return `${Math.floor(days / 30)}m`
}

function getLeadAgeStyle(days: number): string {
  if (days <= 3) return 'text-emerald-600 bg-emerald-50'
  if (days <= 14) return 'text-amber-600 bg-amber-50'
  return 'text-red-500 bg-red-50'
}

function getPriorityStyle(priority?: string) {
  switch (priority) {
    case 'A': return { label: 'A', cls: 'bg-red-500' }
    case 'B': return { label: 'B', cls: 'bg-amber-400' }
    case 'C': return { label: 'C', cls: 'bg-gray-300' }
    default:  return { label: '–', cls: 'bg-gray-200' }
  }
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

function getProductoLabel(producto: string) {
  return producto === 'alfajores' ? 'Alfajores' : 'Galletitas'
}

function getVolumenLabel(volumen: string) {
  switch (volumen) {
    case 'menos-1000': return '<1K'
    case '1000-5000': return '1-5K'
    case 'mas-5000': return '>5K'
    default: return volumen
  }
}

// ─── Component ───────────────────────────────────────────────────
export function LeadCard({ lead, isDragging, onUpdateLead, onDeleteLead }: LeadCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const hasMovedRef = useRef(false)
  const clickStartTime = useRef<number | null>(null)
  const clickStartPos = useRef<{ x: number; y: number } | null>(null)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id })

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('resize', check)
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (isSortableDragging || isDragging) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
        clickTimeoutRef.current = null
      }
    }
  }, [isSortableDragging, isDragging])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.4 : 1,
  }

  // ─── Touch handlers (mobile tap vs drag) ─────────────
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
    let cleanPhone = lead.telefono.replace(/[\s\-\(\)\+\.]/g, '').replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 8) { alert('Número de teléfono inválido'); return }
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1)
    if (!cleanPhone.startsWith('54') && !cleanPhone.match(/^[1-9]\d{1,2}/)) {
      if (cleanPhone.length <= 10) cleanPhone = `54${cleanPhone}`
    }
    if (cleanPhone.length < 10) { alert('Número de teléfono inválido'); return }
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  const openCard = () => {
    if (!isSortableDragging && !isDragging) setIsDialogOpen(true)
  }

  const priority = getPriorityStyle(lead.priority)
  const ageDays = getLeadAgeDays(lead.createdAt)

  return (
    <>
      <div ref={setNodeRef} style={style} className="w-full">
        <div
          className={cn(
            'group relative rounded-md border border-gray-200/80 bg-white px-3 py-2.5',
            'cursor-pointer select-none touch-manipulation',
            'hover:border-gray-300 hover:shadow-[0_2px_8px_rgb(0,0,0,0.04)] transition-all duration-150',
            (isDragging || isSortableDragging) && 'shadow-lg scale-[1.02] opacity-80 border-gray-300 rotate-1'
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
          {/* Row 1: Priority dot + Name + Age + Menu */}
          <div className="flex items-center gap-2 mb-1.5">
            {/* Drag handle (desktop only) */}
            {!isMobile && (
              <div
                data-drag-handle
                className="cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity -ml-1"
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3.5 w-3.5 text-gray-400" />
              </div>
            )}

            {/* Priority dot */}
            <span
              className={cn('h-2 w-2 rounded-full shrink-0', priority.cls)}
              title={`Prioridad ${priority.label}`}
            />

            {/* Name */}
            <span className="flex-1 text-[13px] font-medium text-gray-900 truncate leading-tight">
              {lead.nombre}
            </span>

            {/* Age badge */}
            <span className={cn(
              'crm-badge !px-1.5 !py-0 !text-[10px] !font-semibold tabular-nums shrink-0',
              getLeadAgeStyle(ageDays)
            )}>
              {getLeadAgeLabel(ageDays)}
            </span>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6 shrink-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity',
                    'hover:bg-gray-100 focus-visible:opacity-100'
                  )}
                >
                  <MoreHorizontal className="h-3.5 w-3.5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true) }}>
                  <Eye className="h-3.5 w-3.5 mr-2" />
                  Ver detalles
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${lead.email}` }}>
                  <Mail className="h-3.5 w-3.5 mr-2" />
                  Enviar email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.telefono}` }}>
                  <Phone className="h-3.5 w-3.5 mr-2" />
                  Llamar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleWhatsAppClick}>
                  <MessageCircle className="h-3.5 w-3.5 mr-2" />
                  WhatsApp
                </DropdownMenuItem>
                {onDeleteLead && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true) }}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
          <div className="flex items-center gap-1.5 mb-2 pl-4">
            <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="text-[12px] text-gray-500 truncate">{lead.empresa}</span>
          </div>

          {/* Row 3: Metadata badges + amount */}
          <div className="flex items-center gap-1.5 flex-wrap pl-4">
            <span className="crm-badge bg-gray-100 text-gray-600">
              {getProductoLabel(lead.producto)}
            </span>
            <span className="crm-badge bg-gray-100 text-gray-500">
              {getVolumenLabel(lead.volumen)}
            </span>
            {lead.inversionEstimada && (
              <span className="crm-badge bg-emerald-50 text-emerald-700">
                <DollarSign className="h-3 w-3 mr-0.5" />
                {lead.inversionEstimada}
              </span>
            )}
          </div>

          {/* Row 4: Owner + last contact */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 pl-4">
            <div className="flex items-center gap-1.5" title={lead.owner || 'Sin asignar'}>
              <span className={cn(
                'flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0',
                getOwnerColor(lead.owner)
              )}>
                {getOwnerInitial(lead.owner)}
              </span>
              <span className="text-[11px] text-gray-500 truncate max-w-[72px]">
                {lead.owner || 'Sin asignar'}
              </span>
            </div>
            {lead.lastContact && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1 tabular-nums">
                <Clock className="h-2.5 w-2.5" />
                {new Date(lead.lastContact).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      </div>

      <LeadDetailsDialog
        lead={lead}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUpdateLead={onUpdateLead}
      />

      {/* Confirmación de eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar lead</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés eliminar a <span className="font-semibold text-gray-900">{lead.nombre}</span> de <span className="font-semibold text-gray-900">{lead.empresa}</span>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDeleteLead?.(lead.id)}
              className="bg-red-600 text-white hover:bg-red-700 text-sm"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
