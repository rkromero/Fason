"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"

export function ContactSection() {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [producto, setProducto] = useState("")
  const [volume, setVolume] = useState("")
  const [hasBrand, setHasBrand] = useState("")
  const [envasado, setEnvasado] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [showWarning, setShowWarning] = useState(false)
  const [showInvestmentModal, setShowInvestmentModal] = useState(false)
  const [showAlternativeModal, setShowAlternativeModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Cálculo de inversión estimada
  const calculateInvestment = (tipoEnvasado: string): number => {
    const costoInscripcion = 300000
    const costoDiseño = 500000
    let costoEnvasado = 0

    switch (tipoEnvasado) {
      case "flowpack-personalizado":
        costoEnvasado = 4000000
        break
      case "flowpack-cristal":
        costoEnvasado = 0
        break
      case "a-granel":
        costoEnvasado = 1000000
        break
    }

    return costoInscripcion + costoDiseño + costoEnvasado
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!envasado) {
      return
    }
    setShowInvestmentModal(true)
  }

  const handleConfirmInvestment = async () => {
    setIsSubmitting(true)
    setShowInvestmentModal(false)

    try {
      const investmentAmount = calculateInvestment(envasado)
      const inversionEstimada = formatCurrency(investmentAmount)

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          empresa,
          email,
          telefono,
          producto,
          marca: hasBrand,
          volumen: volume,
          envasado,
          mensaje,
          inversionEstimada,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al enviar el formulario")
      }

      router.push("/gracias")
    } catch (error) {
      console.error("Error:", error)
      alert("Hubo un error al enviar tu consulta. Por favor, intentá nuevamente.")
      setIsSubmitting(false)
    }
  }

  const handleCancelInvestment = () => {
    setShowInvestmentModal(false)
    if (envasado === "flowpack-personalizado") {
      setShowAlternativeModal(true)
    }
  }

  const handleInvestmentModalChange = (open: boolean) => {
    if (!open && envasado === "flowpack-personalizado") {
      setShowAlternativeModal(true)
    }
    setShowInvestmentModal(open)
  }

  const handleAcceptAlternative = () => {
    setEnvasado("flowpack-cristal")
    setShowAlternativeModal(false)
    setShowInvestmentModal(true)
  }

  const handleRejectAlternative = () => {
    setShowAlternativeModal(false)
  }

  const investmentAmount = envasado ? calculateInvestment(envasado) : 0

  return (
    <section id="contacto" className="section-padding-y container-padding-x bg-background">
      <div className="mx-auto max-w-3xl">
        <div className="section-title-gap-lg mb-12 flex flex-col text-center">
          <h2 className="heading-lg text-balance">Calcular inversión y cotizar</h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Completá el formulario y nos pondremos en contacto a la brevedad.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border bg-card p-8 shadow-lg">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre y apellido *</Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa o marca *</Label>
              <Input id="empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Mi Marca SRL" required />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email corporativo *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@mimarca.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input id="telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+54 9 11 1234-5678" required />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="producto">Tipo de producto *</Label>
              <Select value={producto} onValueChange={setProducto}>
                <SelectTrigger id="producto">
                  <SelectValue placeholder="Seleccioná el tipo de producto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alfajores">Alfajores</SelectItem>
                  <SelectItem value="galletitas">Galletitas</SelectItem>
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
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
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
              <Label htmlFor="envasado">Tipo de envasado *</Label>
              <Select value={envasado} onValueChange={setEnvasado}>
                <SelectTrigger id="envasado">
                  <SelectValue placeholder="Seleccioná el tipo de envasado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a-granel">A granel</SelectItem>
                  <SelectItem value="flowpack-personalizado">Flow pack personalizado</SelectItem>
                  <SelectItem value="flowpack-cristal">Flowpack cristal</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Textarea id="mensaje" value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Contanos brevemente sobre tu proyecto..." maxLength={250} rows={4} />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar solicitud"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Al enviar este formulario, aceptás que nos pongamos en contacto para brindarte información sobre nuestros
            servicios.
          </p>
        </form>

        {/* Modal de inversión estimada */}
        <Dialog open={showInvestmentModal} onOpenChange={handleInvestmentModalChange}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Inversión estimada</DialogTitle>
              <DialogDescription className="pt-4 text-base">
                La inversión estimada debido a la personalización y fabricación es de{" "}
                <strong className="text-lg text-foreground">{formatCurrency(investmentAmount)}</strong>.
              </DialogDescription>
              <DialogDescription className="pt-2">
                ¿Estás de acuerdo con esta inversión?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCancelInvestment}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmInvestment} disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "OK con esa inversión"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de alternativa Flowpack Cristal */}
        <Dialog open={showAlternativeModal} onOpenChange={setShowAlternativeModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Alternativa más accesible</DialogTitle>
              <DialogDescription className="pt-4 text-base">
                Podés optar por Flowpack Cristal, que tiene una inversión más baja.
              </DialogDescription>
              <DialogDescription className="pt-2">
                ¿Querés cambiar a Flowpack Cristal y continuar?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleRejectAlternative}>
                No, gracias
              </Button>
              <Button onClick={handleAcceptAlternative}>
                Sí, cambiar a Flowpack Cristal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
