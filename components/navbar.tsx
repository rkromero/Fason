"use client"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/pro-blocks/logo"

export function Navbar() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-padding-x mx-auto flex h-20 md:h-24 max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="h-12 w-auto md:h-16 lg:h-20" />
        </div>
        <div className="hidden gap-6 md:flex">
          <button onClick={() => scrollTo("beneficios")} className="text-sm text-foreground/80 hover:text-foreground">
            Beneficios
          </button>
          <button onClick={() => scrollTo("productos")} className="text-sm text-foreground/80 hover:text-foreground">
            Productos
          </button>
          <button onClick={() => scrollTo("proceso")} className="text-sm text-foreground/80 hover:text-foreground">
            Proceso
          </button>
          <button onClick={() => scrollTo("certificaciones")} className="text-sm text-foreground/80 hover:text-foreground">
            Certificaciones
          </button>
          <button onClick={() => scrollTo("contacto")} className="text-sm text-foreground/80 hover:text-foreground">
            Contacto
          </button>
        </div>
        <Button onClick={() => scrollTo("contacto")} size="lg">
          Solicitá tu cotización
        </Button>
      </div>
    </nav>
  )
}
