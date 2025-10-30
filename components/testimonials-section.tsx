"use client"

import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const testimonials = [
  {
    rating: 5,
    text: "Excelente atención y calidad en cada detalle. Cumplieron con todo lo prometido.",
    client: "Distribuidora La Unión",
    date: "abril 2024",
  },
  {
    rating: 5,
    text: "Nos fabricaron alfajores a medida con nuestro logo. Todo salió perfecto, súper recomendados.",
    client: "María G., emprendedora",
    date: "julio 2024",
  },
  {
    rating: 5,
    text: "El mejor servicio de fason que encontramos, seriedad y cumplimiento total.",
    client: "Dulce Sur",
    date: "agosto 2024",
  },
  {
    rating: 5,
    text: "Muy buena experiencia, acompañaron todo el proceso de desarrollo del producto.",
    client: "Alimentos Rivera",
    date: "mayo 2024",
  },
  {
    rating: 5,
    text: "Profesionales de primera, entregaron a tiempo y con la calidad que esperábamos.",
    client: "Confitería El Buen Gusto",
    date: "junio 2024",
  },
  {
    rating: 5,
    text: "Superaron nuestras expectativas. Volveremos a trabajar con ellos sin duda.",
    client: "Delicias del Norte",
    date: "septiembre 2024",
  },
]

const GoogleBusinessLink = "https://g.page/r/[TU_LINK_DE_GOOGLE_BUSINESS]" // Actualizar con el link real de Google Business

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12.56c-.24 0-.49.02-.73.07C6.45 1.08 3.97 3.35 2.52 6.42 1.07 9.5.29 13.1.87 16.57c.58 3.47 2.42 6.41 5.28 8.23.9.58 1.88 1.03 2.93 1.33 1.05.3 2.15.45 3.27.45 1.27 0 2.5-.22 3.66-.64 1.16-.42 2.24-1.03 3.21-1.81.97-.78 1.81-1.71 2.48-2.77.67-1.06 1.15-2.24 1.4-3.5.13-.63.19-1.28.19-1.93zm-7.36 9.75c-1.03 0-2.03-.18-2.97-.53-.94-.35-1.79-.86-2.53-1.51-.74-.65-1.35-1.43-1.81-2.31-.46-.88-.69-1.82-.69-2.81 0-.99.23-1.93.69-2.81.46-.88 1.07-1.66 1.81-2.31.74-.65 1.59-1.16 2.53-1.51.94-.35 1.94-.53 2.97-.53 1.03 0 2.03.18 2.97.53.94.35 1.79.86 2.53 1.51.74.65 1.35 1.43 1.81 2.31.46.88.69 1.82.69 2.81 0 .99-.23 1.93-.69 2.81-.46.88-1.07 1.66-1.81 2.31-.74.65-1.59 1.16-2.53 1.51-.94.35-1.94.53-2.97.53z" />
    </svg>
  )
}

export function TestimonialsSection() {
  return (
    <section id="testimonios" className="section-padding-y container-padding-x bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="section-title-gap-lg mx-auto mb-12 flex max-w-3xl flex-col text-center">
          <h2 className="heading-lg text-balance">Lo que dicen nuestros clientes</h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Opiniones reales de quienes confiaron en nosotros para fabricar sus productos.
          </p>
        </div>

        {/* Desktop: Grid de 3 columnas */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-6 lg:gap-8">
          {testimonials.slice(0, 6).map((testimonial, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-center gap-2">
                <StarRating rating={testimonial.rating} />
                <div className="ml-auto text-gray-400">
                  <GoogleIcon />
                </div>
              </div>
              <p className="mb-4 text-muted-foreground leading-relaxed">{testimonial.text}</p>
              <div className="border-t pt-4">
                <p className="font-semibold text-foreground">{testimonial.client}</p>
                <p className="text-sm text-muted-foreground">{testimonial.date}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Carrusel */}
        <div className="md:hidden">
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4">
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <StarRating rating={testimonial.rating} />
                      <div className="ml-auto text-gray-400">
                        <GoogleIcon />
                      </div>
                    </div>
                    <p className="mb-4 text-muted-foreground leading-relaxed">{testimonial.text}</p>
                    <div className="border-t pt-4">
                      <p className="font-semibold text-foreground">{testimonial.client}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.date}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* CTA para ver más reseñas */}
        <div className="mt-12 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            asChild
            className="group gap-2"
          >
            <a
              href={GoogleBusinessLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GoogleIcon />
              Ver más reseñas en Google
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
