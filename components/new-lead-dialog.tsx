"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface NewLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeadCreated: () => void
}

export function NewLeadDialog({ open, onOpenChange, onLeadCreated }: NewLeadDialogProps) {
  const [nombre, setNombre] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [producto, setProducto] = useState<'alfajores' | 'galletitas' | ''>('')
  const [marca, setMarca] = useState<'si' | 'no' | ''>('')
  const [volumen, setVolumen] = useState<'menos-1000' | '1000-5000' | 'mas-5000' | ''>('')
  const [envasado, setEnvasado] = useState<'flowpack-personalizado' | 'flowpack-cristal' | 'a-granel' | ''>('')
  const [mensaje, setMensaje] = useState('')
  const [inversionEstimada, setInversionEstimada] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos requeridos
    if (!nombre || !empresa || !email || !telefono || !producto || !marca || !volumen || !envasado) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Por favor ingresa un email válido')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          empresa,
          email,
          telefono,
          producto,
          marca,
          volumen,
          envasado,
          mensaje: mensaje || undefined,
          inversionEstimada: inversionEstimada || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al crear el lead')
      }

      const data = await response.json()
      toast.success(`Lead "${nombre}" creado correctamente`)
      
      // Resetear formulario
      setNombre('')
      setEmpresa('')
      setEmail('')
      setTelefono('')
      setProducto('')
      setMarca('')
      setVolumen('')
      setEnvasado('')
      setMensaje('')
      setInversionEstimada('')
      
      // Cerrar modal y refrescar lista
      onOpenChange(false)
      onLeadCreated()
    } catch (error) {
      console.error('Error al crear lead:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al crear el lead: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        // Resetear formulario al cerrar
        setNombre('')
        setEmpresa('')
        setEmail('')
        setTelefono('')
        setProducto('')
        setMarca('')
        setVolumen('')
        setEnvasado('')
        setMensaje('')
        setInversionEstimada('')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nuevo Lead</DialogTitle>
          <DialogDescription>
            Completa los datos del nuevo lead para agregarlo al CRM
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del contacto"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="empresa">
                Empresa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="empresa"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Nombre de la empresa"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+54 11 1234-5678"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Producto */}
            <div className="space-y-2">
              <Label htmlFor="producto">
                Producto <span className="text-red-500">*</span>
              </Label>
              <Select
                value={producto}
                onValueChange={(value) => setProducto(value as 'alfajores' | 'galletitas')}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger id="producto">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alfajores">Alfajores</SelectItem>
                  <SelectItem value="galletitas">Galletitas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="marca">
                ¿Tiene marca registrada? <span className="text-red-500">*</span>
              </Label>
              <Select
                value={marca}
                onValueChange={(value) => setMarca(value as 'si' | 'no')}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger id="marca">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Volumen */}
            <div className="space-y-2">
              <Label htmlFor="volumen">
                Volumen mensual <span className="text-red-500">*</span>
              </Label>
              <Select
                value={volumen}
                onValueChange={(value) => setVolumen(value as 'menos-1000' | '1000-5000' | 'mas-5000')}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger id="volumen">
                  <SelectValue placeholder="Seleccionar volumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menos-1000">Menos de 1,000 unidades/mes</SelectItem>
                  <SelectItem value="1000-5000">1,000 - 5,000 unidades/mes</SelectItem>
                  <SelectItem value="mas-5000">Más de 5,000 unidades/mes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Envasado */}
            <div className="space-y-2">
              <Label htmlFor="envasado">
                Tipo de envasado <span className="text-red-500">*</span>
              </Label>
              <Select
                value={envasado}
                onValueChange={(value) => setEnvasado(value as 'flowpack-personalizado' | 'flowpack-cristal' | 'a-granel')}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger id="envasado">
                  <SelectValue placeholder="Seleccionar envasado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flowpack-personalizado">Flowpack Personalizado</SelectItem>
                  <SelectItem value="flowpack-cristal">Flowpack Cristal</SelectItem>
                  <SelectItem value="a-granel">A Granel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <Label htmlFor="mensaje">Mensaje (opcional)</Label>
            <Textarea
              id="mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Mensaje o comentarios adicionales"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Inversión Estimada */}
          <div className="space-y-2">
            <Label htmlFor="inversionEstimada">Inversión Estimada (opcional)</Label>
            <Input
              id="inversionEstimada"
              value={inversionEstimada}
              onChange={(e) => setInversionEstimada(e.target.value)}
              placeholder="Ej: $5,000,000"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

