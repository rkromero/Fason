"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  const scrollToContact = () => {
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="section-padding-y container-padding-x relative overflow-hidden bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm w-fit">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Fábrica habilitada RNE y RNPA
            </div>
            <h1 className="heading-xl text-balance">Fabricamos tu producto con tu marca</h1>
            <p className="text-pretty text-lg text-muted-foreground leading-relaxed">
              Somos una fábrica argentina con experiencia, calidad certificada y compromiso. Transformamos tu idea en
              productos terminados listos para el mercado.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" onClick={scrollToContact} className="group">
                Solicitá tu cotización
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToContact}>
                Conocé más
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">Toneladas mensuales</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-primary">15+</div>
                <div className="text-sm text-muted-foreground">Años de experiencia</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-2xl border bg-muted shadow-2xl">
              <img
                src="/modern-food-manufacturing-facility-with-alfajores-.jpg"
                alt="Línea de producción de alfajores y galletitas"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-xl border bg-card p-4 shadow-lg">
              <div className="text-sm font-medium text-muted-foreground">Capacidad productiva</div>
              <div className="text-2xl font-bold text-primary">100 ton/mes</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
