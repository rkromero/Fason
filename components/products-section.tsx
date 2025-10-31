import { Cake, Cookie, Layers } from "lucide-react"

const products = [
  {
    icon: Cake,
    title: "Alfajores",
    items: [
      "Alfajores de chocolate negro",
      "Alfajores de chocolate blanco",
      "Alfajores con cobertura premium",
      "Alfajores rellenos personalizados",
    ],
    image: "/premium-chocolate-covered-alfajores-argentinos.jpg",
  },
  {
    icon: Cookie,
    title: "Galletitas",
    items: [
      "Galletitas dulces surtidas",
      "Galletitas saladas crackers",
      "Cookies con chips de chocolate",
      "Galletitas integrales y funcionales",
    ],
    image: "/assorted-cookies-and-crackers-variety-pack.jpg",
  },
  {
    icon: Layers,
    title: "Tapas y bases",
    items: ["Tapas para alfajores", "Bases de galletitas", "Obleas personalizadas", "Productos semi-elaborados"],
    image: "/cookie-bases-and-wafers-for-alfajores-production.jpg",
  },
]

export function ProductsSection() {
  return (
    <section id="productos" className="section-padding-y container-padding-x bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="section-title-gap-lg mx-auto mb-12 flex max-w-3xl flex-col text-center">
          <h2 className="heading-lg text-balance">Producción para Terceros: Fason de Productos</h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Especialistas en <strong>fason de alfajores</strong>, <strong>fason de galletitas</strong> y <strong>producción para terceros</strong>. Fabricamos una amplia variedad de productos con tu marca y receta.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {products.map((product, index) => (
            <div
              key={index}
              className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-lg"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <product.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-4 text-2xl font-semibold">{product.title}</h3>
                <ul className="space-y-2">
                  {product.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
