"use client"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/pro-blocks/logo"

export function Navbar() {
  const scrollToContact = () => {
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-padding-x mx-auto flex h-16 max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
        </div>
        <Button onClick={scrollToContact} size="lg">
          Solicitá tu cotización
        </Button>
      </div>
    </nav>
  )
}
