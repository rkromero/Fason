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
import { Mail, Phone, Building2, DollarSign, MoreVertical, MessageCircle, GripVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { LeadDetailsDialog } from './lead-details-dialog'

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void
}

export function LeadCard({ lead, isDragging, onUpdateLead }: LeadCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => {
      window.removeEventListener('resize', checkMobile)
      // Limpiar timeout al desmontar
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])

  // Detectar cuando se inicia un drag para cancelar el click
  useEffect(() => {
    if (isSortableDragging || isDragging) {
      // Si se inicia un drag, cancelar cualquier click pendiente
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
        clickTimeoutRef.current = null
      }
    }
  }, [isSortableDragging, isDragging])

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
    
    // Si estamos en drag, no hacer click
    if (isSortableDragging || isDragging) {
      return
    }
    
    // Abrir modal directamente
    e.preventDefault()
    e.stopPropagation()
    setIsDialogOpen(true)
  }

  // Removemos handleMouseDown y handleMouseMove porque interfieren con el drag and drop
  // El drag and drop de dnd-kit maneja estos eventos directamente

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
      // Aumentar el umbral para que sea más fácil hacer tap
      if (distance > 15) {
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
    
    // En mobile, ser más permisivo con los taps
    const isTap = !hasMovedRef.current && 
                  !isSortableDragging && 
                  !isDragging && 
                  timeDiff < 600 && 
                  posDiff.x < 25 && 
                  posDiff.y < 25
    
    if (isTap) {
      // Prevenir que el drag and drop capture el evento
      e.preventDefault()
      e.stopPropagation()
      
      // Abrir el modal directamente
      setIsDialogOpen(true)
    }
    
    // Resetear
    clickStartTime.current = null
    clickStartPos.current = null
    hasMovedRef.current = false
  }

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Limpiar el número de teléfono (quitar espacios, guiones, paréntesis, +, y otros caracteres)
    let cleanPhone = lead.telefono.replace(/[\s\-\(\)\+\.]/g, '')
    
    // Remover cualquier carácter que no sea número
    cleanPhone = cleanPhone.replace(/\D/g, '')
    
    // Si el número está vacío después de limpiar, mostrar error
    if (!cleanPhone || cleanPhone.length < 8) {
      alert('Número de teléfono inválido')
      return
    }
    
    // Si empieza con 0, removerlo (código de país local)
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1)
    }
    
    // Si no empieza con código de país, asumir Argentina (54)
    // Verificar si ya tiene código de país (Argentina: 54, otros países tienen códigos de 1-3 dígitos)
    if (!cleanPhone.startsWith('54') && !cleanPhone.match(/^[1-9]\d{1,2}/)) {
      // Si tiene 10 dígitos o menos, asumir que es número argentino sin código de país
      if (cleanPhone.length <= 10) {
        cleanPhone = `54${cleanPhone}`
      }
    }
    
    // Validar que el número tenga al menos 10 dígitos (código de país + número)
    if (cleanPhone.length < 10) {
      alert('Número de teléfono inválido')
      return
    }
    
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="w-full"
      >
        <Card
          className={cn(
            'cursor-pointer touch-manipulation select-none w-full relative bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg',
            (isDragging || isSortableDragging) && 'shadow-xl scale-105 opacity-90 rotate-2'
          )}
          // onClick directo sin verificaciones complejas
          onClick={(e) => {
            // Verificar que el target no sea un botón, enlace, o el handle de drag
            const target = e.target as HTMLElement
            if (
              target.closest('button') ||
              target.closest('a') ||
              target.closest('[role="button"]') ||
              target.closest('[data-drag-handle]')
            ) {
              return
            }
            
            // Si estamos en drag, no hacer click
            if (isSortableDragging || isDragging) {
              return
            }
            
            // Abrir modal directamente
            setIsDialogOpen(true)
          }}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-start justify-between gap-2">
            {/* Handle de drag solo en desktop */}
            {!isMobile && (
              <div
                data-drag-handle
                className="cursor-grab active:cursor-grabbing touch-none mr-0.5 opacity-50 hover:opacity-70 transition-opacity"
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3.5 w-3.5 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium text-gray-900 truncate leading-tight">{lead.nombre}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.empresa}</span>
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 shrink-0 touch-manipulation hover:bg-gray-100 rounded-full"
                >
                  <MoreVertical className="h-4 w-4 text-gray-600" />
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
        <CardContent className="space-y-2 px-3 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 border-0 rounded-full font-medium">
              {getProductoLabel(lead.producto)}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 border-0 rounded-full font-medium">
              {getVolumenLabel(lead.volumen)}
            </Badge>
          </div>

          {lead.inversionEstimada && (
            <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-green-50 rounded px-2 py-1">
              <DollarSign className="h-3 w-3 text-green-600 shrink-0" />
              <span className="font-semibold text-green-700">{lead.inversionEstimada}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-gray-600 pt-1 border-t border-gray-100">
            <a
              href={`mailto:${lead.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors touch-manipulation text-gray-600 hover:bg-blue-50 rounded px-1.5 py-0.5"
            >
              <Mail className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline text-[10px] font-medium">Email</span>
            </a>
            <a
              href={`tel:${lead.telefono}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-green-600 transition-colors touch-manipulation text-gray-600 hover:bg-green-50 rounded px-1.5 py-0.5"
            >
              <Phone className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline text-[10px] font-medium">Llamar</span>
            </a>
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-1 hover:text-[#25D366] transition-colors touch-manipulation text-gray-600 hover:bg-green-50 rounded px-1.5 py-0.5"
              title="Abrir WhatsApp"
            >
              <svg
                className="h-3 w-3 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span className="hidden sm:inline text-[10px] font-medium">WhatsApp</span>
            </button>
          </div>

          {lead.lastContact && (
            <div className="text-[10px] text-gray-500 pt-1">
              Último contacto: {new Date(lead.lastContact).toLocaleDateString('es-AR')}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      <LeadDetailsDialog
        lead={lead}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUpdateLead={onUpdateLead}
      />
    </>
  )
}

