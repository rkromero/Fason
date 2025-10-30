"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"

export function ContactSection() {
  const [volume, setVolume] = useState("")
  const [hasBrand, setHasBrand] = useState("")
  const [showWarning, setShowWarning] = useState(false)

  const handleVolumeChange = (value: string) => {
    setVolume(value)
    checkWarning(value, hasBrand)
  }

  const handleBrandChange = (value: string) => {
    setHasBrand(value)
    checkWarning(volume, value)
  }

  const checkWarning = (vol: string, brand: string) => {
    if (vol === "menos-1000" || brand === "no") {
      setShowWarning(true)
    } else {
      setShowWarning(false)
    }
  }

  return (
    <section id="contacto" className="section-padding-y container-padding-x bg-background">
      <div className="mx-auto max-w-3xl">
        <div className="section-title-gap-lg mb-12 flex flex-col text-center">
          <h2 className="heading-lg text-balance">Solicitá tu cotización</h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Completá el formulario y nos pondremos en contacto a la brevedad.
          </p>
        </div>
        <form className="space-y-6 rounded-2xl border bg-card p-8 shadow-lg">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre y apellido *</Label>
              <Input id="nombre" placeholder="Juan Pérez" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa o marca *</Label>
              <Input id="empresa" placeholder="Mi Marca SRL" required />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email corporativo *</Label>
              <Input id="email" type="email" placeholder="contacto@mimarca.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input id="telefono" type="tel" placeholder="+54 9 11 1234-5678" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="producto">Tipo de producto *</Label>
            <Select>
              <SelectTrigger id="producto">
                <SelectValue placeholder="Seleccioná el tipo de producto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alfajores">Alfajores</SelectItem>
                <SelectItem value="galletitas-dulces">Galletitas dulces</SelectItem>
                <SelectItem value="galletitas-saladas">Galletitas saladas</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="volumen">Volumen estimado mensual *</Label>
            <Select onValueChange={handleVolumeChange}>
              <SelectTrigger id="volumen">
                <SelectValue placeholder="Seleccioná el volumen estimado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="menos-1000">Menos de 1.000 unidades</SelectItem>
                <SelectItem value="1000-5000">1.000 - 5.000 unidades</SelectItem>
                <SelectItem value="mas-5000">Más de 5.000 unidades</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="marca">¿Tenés marca registrada o proyecto en marcha? *</Label>
            <Select onValueChange={handleBrandChange}>
              <SelectTrigger id="marca">
                <SelectValue placeholder="Seleccioná una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="si">Sí</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showWarning && (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="text-sm leading-relaxed">
                <p className="font-medium mb-1">Información importante</p>
                <p>
                  Actualmente trabajamos con proyectos en marcha o volúmenes productivos. Si estás iniciando, dejá tu
                  contacto y te avisaremos cuando abramos cupos para emprendedores.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="mensaje">Mensaje (máx. 250 caracteres)</Label>
            <Textarea id="mensaje" placeholder="Contanos brevemente sobre tu proyecto..." maxLength={250} rows={4} />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Enviar solicitud
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Al enviar este formulario, aceptás que nos pongamos en contacto para brindarte información sobre nuestros
            servicios.
          </p>
        </form>
      </div>
    </section>
  )
}
