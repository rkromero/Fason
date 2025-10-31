"use client"

import Image from "next/image"
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
    text: "Nos fabricaron alfajores a medida con nuestro logo en fason de productos. Todo salió perfecto, súper recomendados.",
    client: "María G., emprendedora",
    date: "julio 2024",
  },
  {
    rating: 5,
    text: "El mejor servicio de producción para terceros que encontramos, seriedad y cumplimiento total en fason de alfajores.",
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

const GoogleBusinessLink = "https://www.google.com/search?q=compania+de+alfajores&oq=compania+de+al&gs_lcrp=EgZjaHJvbWUqBggAEEUYOzIGCAAQRRg7MgYIARBFGDkyBggCEEUYPDIGCAMQRRg8MgYIBBBFGDwyBggFEEUYQdIBCDIxOTNqMGoxqAIAsAIA&sourceid=chrome&ie=UTF-8&sei=P_IDaaSuK6u85OUP1tje2Q4#lrd=0x67eda69e5efd41d9:0x1aceb5a7eb659601,1,,,,"

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
    <Image
      src="/google.png"
      alt="Google"
      width={24}
      height={24}
      className="h-6 w-6"
    />
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
                <div className="ml-auto">
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
                      <div className="ml-auto">
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
