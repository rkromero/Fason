import { Award, Shield, Users, Package, TrendingUp, CheckCircle } from "lucide-react"

const benefits = [
  {
    icon: Award,
    title: "Calidad certificada",
    description: "Habilitación RNE y RNPA vigente. Cumplimos con todas las normativas alimentarias argentinas.",
  },
  {
    icon: TrendingUp,
    title: "Producción flexible",
    description: "Desde lotes pequeños hasta 100 toneladas mensuales. Escalamos con tu crecimiento.",
  },
  {
    icon: Users,
    title: "Asesoramiento personalizado",
    description: "Te acompañamos en cada etapa: desde la formulación hasta el producto final.",
  },
  {
    icon: Shield,
    title: "Cumplimiento y confidencialidad",
    description: "Seriedad en tiempos de entrega y total confidencialidad de tus recetas.",
  },
  {
    icon: Package,
    title: "Packaging profesional",
    description: "Envasado de calidad con tu marca. Presentación lista para góndola.",
  },
  {
    icon: CheckCircle,
    title: "Escalabilidad garantizada",
    description: "Infraestructura preparada para acompañar el crecimiento de tu marca.",
  },
]

export function BenefitsSection() {
  return (
    <section id="beneficios" className="section-padding-y container-padding-x bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="section-title-gap-lg mx-auto mb-12 flex max-w-3xl flex-col text-center">
          <h2 className="heading-lg text-balance">¿Por qué elegirnos para fabricar tu marca?</h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Combinamos experiencia, tecnología y compromiso para que tu producto llegue al mercado con la máxima
            calidad.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
