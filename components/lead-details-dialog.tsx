"use client"

import { Lead } from '@/lib/types/lead'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Mail, Phone, Building2, DollarSign, Calendar, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LeadDetailsDialogProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
  const getProductoLabel = (producto: string) => {
    return producto === 'alfajores' ? 'Alfajores' : 'Galletitas'
  }

  const getEnvasadoLabel = (envasado: string) => {
    switch (envasado) {
      case 'flowpack-personalizado':
        return 'Flow pack personalizado'
      case 'flowpack-cristal':
        return 'Flowpack cristal'
      case 'a-granel':
        return 'A granel'
      default:
        return envasado
    }
  }

  const getVolumenLabel = (volumen: string) => {
    switch (volumen) {
      case 'menos-1000':
        return 'Menos de 1.000 unidades'
      case '1000-5000':
        return '1.000 - 5.000 unidades'
      case 'mas-5000':
        return 'Más de 5.000 unidades'
      default:
        return volumen
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{lead.nombre}</DialogTitle>
          <DialogDescription>{lead.empresa}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de contacto */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contacto
            </h3>
            <div className="space-y-2 pl-6">
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                {lead.email}
              </a>
              <a
                href={`tel:${lead.telefono}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                {lead.telefono}
              </a>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {lead.empresa}
              </div>
            </div>
            <div className="flex gap-2 mt-4 pl-6">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = `mailto:${lead.email}`}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = `tel:${lead.telefono}`}
              >
                <Phone className="h-4 w-4 mr-2" />
                Llamar
              </Button>
            </div>
          </div>

          <Separator />

          {/* Detalles del proyecto */}
          <div>
            <h3 className="font-semibold mb-3">Detalles del Proyecto</h3>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Producto:</span>
                <Badge>{getProductoLabel(lead.producto)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Marca registrada:</span>
                <Badge variant={lead.marca === 'si' ? 'default' : 'secondary'}>
                  {lead.marca === 'si' ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Volumen mensual:</span>
                <span className="font-medium">{getVolumenLabel(lead.volumen)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Envasado:</span>
                <span className="font-medium">{getEnvasadoLabel(lead.envasado)}</span>
              </div>
            </div>
          </div>

          {lead.inversionEstimada && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Inversión Estimada
                </h3>
                <div className="pl-6 text-2xl font-bold text-green-600">
                  {lead.inversionEstimada}
                </div>
              </div>
            </>
          )}

          {lead.mensaje && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Mensaje
                </h3>
                <p className="pl-6 text-muted-foreground whitespace-pre-wrap">
                  {lead.mensaje}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Fechas */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Historial
            </h3>
            <div className="space-y-2 pl-6 text-sm text-muted-foreground">
              <div>
                Creado: {new Date(lead.createdAt).toLocaleString('es-AR')}
              </div>
              <div>
                Última actualización: {new Date(lead.updatedAt).toLocaleString('es-AR')}
              </div>
              {lead.lastContact && (
                <div>
                  Último contacto: {new Date(lead.lastContact).toLocaleString('es-AR')}
                </div>
              )}
            </div>
          </div>

          {lead.notes && lead.notes.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Notas</h3>
                <div className="space-y-2 pl-6">
                  {lead.notes.map((note, index) => (
                    <div key={index} className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

