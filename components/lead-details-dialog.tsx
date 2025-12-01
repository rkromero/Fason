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
import { Mail, Phone, Building2, DollarSign, Calendar, MessageSquare, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LeadStage, STAGES } from '@/lib/types/lead'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface LeadDetailsDialogProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void
}

export function LeadDetailsDialog({ lead, open, onOpenChange, onUpdateLead }: LeadDetailsDialogProps) {
  const [currentStage, setCurrentStage] = useState<LeadStage>(lead.stage)
  const [isUpdating, setIsUpdating] = useState(false)

  // Actualizar el estado local cuando cambia el lead
  useEffect(() => {
    setCurrentStage(lead.stage)
  }, [lead.stage])

  const handleStageChange = async (newStage: LeadStage) => {
    if (newStage === lead.stage) return
    
    setCurrentStage(newStage)
    setIsUpdating(true)
    
    try {
      if (onUpdateLead) {
        await onUpdateLead(lead.id, { stage: newStage })
        toast.success('Estado actualizado correctamente')
      } else {
        // Si no hay función de actualización, hacer la llamada directamente
        const response = await fetch(`/api/leads/${lead.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stage: newStage }),
        })
        
        if (response.ok) {
          toast.success('Estado actualizado correctamente')
        } else {
          throw new Error('Error al actualizar el estado')
        }
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      toast.error('Error al actualizar el estado')
      setCurrentStage(lead.stage) // Revertir el cambio
    } finally {
      setIsUpdating(false)
    }
  }
  const handleWhatsAppClick = () => {
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
          {/* Estado del Lead */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Estado del Lead
            </h3>
            <div className="pl-6">
              <Select
                value={currentStage}
                onValueChange={handleStageChange}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => {
                    // Extraer el color de fondo de la clase Tailwind
                    const bgColor = stage.color.split(' ')[0]
                    return (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${bgColor}`} />
                          {stage.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
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
            <div className="flex flex-wrap gap-2 mt-4 pl-6">
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
              <Button
                size="sm"
                variant="outline"
                onClick={handleWhatsAppClick}
                className="bg-[#25D366] hover:bg-[#20BA5A] text-white border-[#25D366] hover:border-[#20BA5A]"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
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

