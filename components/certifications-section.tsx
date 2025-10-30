import { Award, Shield, CheckCircle, FileCheck } from "lucide-react"

const certifications = [
  {
    icon: Award,
    title: "RNE Habilitado",
    description: "Registro Nacional de Establecimientos",
  },
  {
    icon: Shield,
    title: "RNPA Vigente",
    description: "Registro Nacional de Productos Alimenticios",
  },
  {
    icon: CheckCircle,
    title: "BPM Certificadas",
    description: "Buenas Prácticas de Manufactura",
  },
  {
    icon: FileCheck,
    title: "Trazabilidad completa",
    description: "Control de calidad en cada etapa",
  },
]

export function CertificationsSection() {
  return (
    <section id="certificaciones" className="section-padding-y container-padding-x bg-primary/5">
      <div className="mx-auto max-w-7xl">
        <div className="section-title-gap-lg mx-auto mb-12 flex max-w-3xl flex-col text-center">
          <h2 className="heading-lg text-balance">Calidad y cumplimiento garantizados</h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Contamos con todas las habilitaciones y certificaciones necesarias para operar con los más altos estándares.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {certifications.map((cert, index) => (
            <div key={index} className="flex flex-col items-center rounded-xl border bg-card p-6 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <cert.icon className="h-8 w-8" />
              </div>
              <h3 className="mb-2 font-semibold">{cert.title}</h3>
              <p className="text-sm text-muted-foreground">{cert.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
