"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  const scrollToContact = () => {
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="section-padding-y container-padding-x bg-gradient-to-br from-primary to-secondary">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="heading-lg mb-6 text-balance text-primary-foreground">
          Fabricá con nosotros. Calidad, cumplimiento y pasión por los alimentos.
        </h2>
        <p className="mb-8 text-pretty text-lg text-primary-foreground/90 leading-relaxed">
          Transformamos tu idea en un producto de calidad listo para conquistar el mercado. Empezá hoy mismo.
        </p>
        <Button size="lg" variant="secondary" onClick={scrollToContact} className="group">
          Comenzar ahora
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  )
}
