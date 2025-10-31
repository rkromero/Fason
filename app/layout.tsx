import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Fason de Alfajores y Galletitas | Producción para Terceros | Fábrica Argentina",
  description:
    "Fábrica argentina especializada en fason de alfajores, fason de galletitas y producción para terceros. RNE/RNPA habilitada. 100+ toneladas mensuales. Tu marca, nuestro compromiso.",
  keywords: [
    "fason de alfajores",
    "fason de galletitas",
    "producción para terceros",
    "fason de productos",
    "fabricación a fason",
    "maquila de alfajores",
    "producción de alfajores",
    "maquila de galletitas",
    "producción de galletitas",
    "fábrica de alfajores argentina",
    "fábrica de galletitas argentina",
    "RNE RNPA",
    "producción con marca propia",
    "maquila alimentaria argentina",
  ],
  authors: [{ name: "Compañía de Alfajores" }],
  creator: "Compañía de Alfajores",
  publisher: "Compañía de Alfajores",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://landing.companiadealfajores.com",
    title: "Fason de Alfajores y Galletitas | Producción para Terceros",
    description: "Fábrica argentina especializada en fason de alfajores, fason de galletitas y producción para terceros. RNE/RNPA habilitada.",
    siteName: "Compañía de Alfajores",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fason de Alfajores y Galletitas | Producción para Terceros",
    description: "Fábrica argentina especializada en fason de alfajores, fason de galletitas y producción para terceros.",
  },
  alternates: {
    canonical: "https://landing.companiadealfajores.com",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: "Compañía de Alfajores",
    description: "Fábrica argentina especializada en fason de alfajores, fason de galletitas y producción para terceros",
    url: "https://landing.companiadealfajores.com",
    logo: "https://landing.companiadealfajores.com/logo.png",
    address: {
      "@type": "PostalAddress",
      addressCountry: "AR",
      addressLocality: "Argentina",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: "150",
    },
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: "Fason de Alfajores",
          description: "Fabricación a fason de alfajores con marca propia del cliente",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: "Fason de Galletitas",
          description: "Fabricación a fason de galletitas con marca propia del cliente",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: "Producción para Terceros",
          description: "Servicios de producción para terceros en la industria alimentaria",
        },
      },
    ],
    areaServed: "AR",
    slogan: "Fason de Alfajores y Galletitas | Producción para Terceros",
  }

  return (
    <>
      <html lang="es" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
        </head>
        <body className={`${inter.variable} relative antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    </>
  )
}
