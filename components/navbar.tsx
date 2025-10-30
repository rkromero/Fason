"use client"

import { Button } from "@/components/ui/button"
import { Factory } from "lucide-react"

export function Navbar() {
  const scrollToContact = () => {
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-padding-x mx-auto flex h-16 max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Factory className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">FasonPro</span>
        </div>
        <Button onClick={scrollToContact} size="lg">
          Solicitá tu cotización
        </Button>
      </div>
    </nav>
  )
}
