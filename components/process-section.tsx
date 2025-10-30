import { MessageSquare, FileText, Factory } from "lucide-react"

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Nos contás tu idea",
    description: "Compartí tu proyecto, producto o receta. Analizamos viabilidad y te orientamos.",
  },
  {
    icon: FileText,
    number: "02",
    title: "Asesoramiento y cotización",
    description: "Te brindamos asesoramiento técnico completo y una cotización detallada sin compromiso.",
  },
  {
    icon: Factory,
    number: "03",
    title: "Fabricamos con tu marca",
    description: "Producimos con los más altos estándares y te acompañamos en cada etapa del crecimiento.",
  },
]

export function ProcessSection() {
  return (
    <section className="section-padding-y container-padding-x bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="section-title-gap-lg mx-auto mb-12 flex max-w-3xl flex-col text-center">
          <h2 className="heading-lg text-balance">Cómo trabajamos juntos</h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Un proceso simple y transparente, de la idea al producto terminado.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-background shadow-lg">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
                <div className="mb-2 text-sm font-bold text-primary">{step.number}</div>
                <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-10 hidden h-0.5 w-full bg-gradient-to-r from-primary/50 to-transparent md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
