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
    opacity: isDragging ? 0.5 : 1,
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
          'cursor-grab active:cursor-grabbing',
          (isDragging || isSortableDragging) && 'shadow-lg'
        )}
        {...attributes}
        {...listeners}
        onClick={() => setIsDialogOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{lead.nombre}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3" />
                {lead.empresa}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
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
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{getProductoLabel(lead.producto)}</Badge>
            <Badge variant="outline">{getVolumenLabel(lead.volumen)}</Badge>
          </div>

          {lead.inversionEstimada && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">{lead.inversionEstimada}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a
              href={`mailto:${lead.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Mail className="h-3 w-3" />
              Email
            </a>
            <a
              href={`tel:${lead.telefono}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Phone className="h-3 w-3" />
              Llamar
            </a>
          </div>

          {lead.lastContact && (
            <div className="text-xs text-muted-foreground">
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

