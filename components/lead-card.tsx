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
import { Mail, Phone, Building2, DollarSign, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { LeadDetailsDialog } from './lead-details-dialog'

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
}

export function LeadCard({ lead, isDragging }: LeadCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          'cursor-grab active:cursor-grabbing touch-manipulation',
          (isDragging || isSortableDragging) && 'shadow-lg scale-105'
        )}
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

