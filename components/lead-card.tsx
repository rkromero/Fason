"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Lead } from '@/lib/types/lead'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Phone, Building2, DollarSign, MoreVertical, MessageCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'
import { LeadDetailsDialog } from './lead-details-dialog'

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
}

export function LeadCard({ lead, isDragging }: LeadCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const hasMovedRef = useRef(false)
  const clickStartTime = useRef<number | null>(null)
  const clickStartPos = useRef<{ x: number; y: number } | null>(null)
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
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  const getProductoLabel = (producto: string) => {
    return producto === 'alfajores' ? 'Alfajores' : 'Galletitas'
  }

  const getVolumenLabel = (volumen: string) => {
    switch (volumen) {
      case 'menos-1000':
        return '<1K/mes'
      case '1000-5000':
        return '1K-5K/mes'
      case 'mas-5000':
        return '>5K/mes'
      default:
        return volumen
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Verificar que el target no sea un botón, enlace o elemento interactivo
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]')
    ) {
      return
    }
    
    // Verificar si fue un click rápido (no un drag)
    const timeDiff = clickStartTime.current ? Date.now() - clickStartTime.current : 0
    const posDiff = clickStartPos.current ? {
      x: Math.abs(e.clientX - clickStartPos.current.x),
      y: Math.abs(e.clientY - clickStartPos.current.y)
    } : { x: 0, y: 0 }
    
    // Solo abrir si fue un click rápido y no hubo movimiento significativo
    if (
      !isSortableDragging && 
      !isDragging && 
      timeDiff < 300 && 
      posDiff.x < 10 && 
      posDiff.y < 10
    ) {
      e.preventDefault()
      e.stopPropagation()
      setIsDialogOpen(true)
    }
    
    // Resetear
    clickStartTime.current = null
    clickStartPos.current = null
    hasMovedRef.current = false
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // No capturar si es un botón o enlace
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]')
    ) {
      return
    }
    
    // Guardar posición y tiempo inicial
    clickStartTime.current = Date.now()
    clickStartPos.current = { x: e.clientX, y: e.clientY }
    hasMovedRef.current = false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Si hay movimiento significativo, marcar como drag
    if (clickStartPos.current) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - clickStartPos.current.x, 2) +
        Math.pow(e.clientY - clickStartPos.current.y, 2)
      )
      if (distance > 5) {
        hasMovedRef.current = true
      }
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]')
    ) {
      return
    }
    
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
      if (distance > 10) {
        hasMovedRef.current = true
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]')
    ) {
      clickStartTime.current = null
      clickStartPos.current = null
      return
    }
    
    // Si fue un tap (no drag), abrir el modal
    const timeDiff = clickStartTime.current ? Date.now() - clickStartTime.current : 0
    const touch = e.changedTouches[0]
    const posDiff = clickStartPos.current ? {
      x: Math.abs(touch.clientX - clickStartPos.current.x),
      y: Math.abs(touch.clientY - clickStartPos.current.y)
    } : { x: 0, y: 0 }
    
    if (
      !hasMovedRef.current && 
      !isSortableDragging && 
      !isDragging && 
      timeDiff < 500 && 
      posDiff.x < 15 && 
      posDiff.y < 15
    ) {
      e.preventDefault()
      e.stopPropagation()
      setIsDialogOpen(true)
    }
    
    // Resetear
    clickStartTime.current = null
    clickStartPos.current = null
    hasMovedRef.current = false
  }

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Limpiar el número de teléfono (quitar espacios, guiones, paréntesis)
    const cleanPhone = lead.telefono.replace(/[\s\-\(\)]/g, '')
    // Si no empieza con código de país, asumir Argentina (54)
    const phoneNumber = cleanPhone.startsWith('54') ? cleanPhone : `54${cleanPhone}`
    window.open(`https://wa.me/${phoneNumber}`, '_blank')
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          'cursor-pointer touch-manipulation select-none',
          (isDragging || isSortableDragging) && 'shadow-lg scale-105'
        )}
        onClick={handleCardClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...attributes}
        {...listeners}
      >
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-semibold truncate">{lead.nombre}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1 text-xs sm:text-sm">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.empresa}</span>
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 touch-manipulation"
                >
                  <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsDialogOpen(true)
                  }}
                >
                  Ver detalles
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = `mailto:${lead.email}`
                  }}
                >
                  Enviar email
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = `tel:${lead.telefono}`
                  }}
                >
                  Llamar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              {getProductoLabel(lead.producto)}
            </Badge>
            <Badge variant="outline" className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              {getVolumenLabel(lead.volumen)}
            </Badge>
          </div>

          {lead.inversionEstimada && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
              <span className="font-medium truncate">{lead.inversionEstimada}</span>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground pt-1">
            <a
              href={`mailto:${lead.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-foreground transition-colors touch-manipulation min-h-[32px] sm:min-h-0"
            >
              <Mail className="h-3.5 w-3.5 sm:h-3 sm:w-3 shrink-0" />
              <span className="hidden sm:inline">Email</span>
            </a>
            <a
              href={`tel:${lead.telefono}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-foreground transition-colors touch-manipulation min-h-[32px] sm:min-h-0"
            >
              <Phone className="h-3.5 w-3.5 sm:h-3 sm:w-3 shrink-0" />
              <span className="hidden sm:inline">Llamar</span>
            </a>
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-1 hover:text-[#25D366] transition-colors touch-manipulation min-h-[32px] sm:min-h-0 text-muted-foreground"
              title="Abrir WhatsApp"
            >
              <svg
                className="h-3.5 w-3.5 sm:h-3 sm:w-3 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>

          {lead.lastContact && (
            <div className="text-xs text-muted-foreground pt-1">
              Último contacto: {new Date(lead.lastContact).toLocaleDateString('es-AR')}
            </div>
          )}
        </CardContent>
      </Card>

      <LeadDetailsDialog
        lead={lead}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}

