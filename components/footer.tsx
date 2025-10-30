import { Factory, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container-padding-x section-padding-y mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Factory className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">FasonPro</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fábrica argentina habilitada especializada en fabricación a fason de alfajores y galletitas.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Productos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Alfajores</li>
              <li>Galletitas dulces</li>
              <li>Galletitas saladas</li>
              <li>Tapas y bases</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Empresa</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Sobre nosotros</li>
              <li>Certificaciones</li>
              <li>Proceso de trabajo</li>
              <li>Contacto</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Contacto</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>contacto@fasonpro.com.ar</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>+54 9 11 1234-5678</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Buenos Aires, Argentina</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} FasonPro. Todos los derechos reservados. RNE y RNPA habilitados.</p>
        </div>
      </div>
    </footer>
  )
}
