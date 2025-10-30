import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Fabricación a Fason | Alfajores y Galletitas con tu Marca",
  description:
    "Fábrica argentina habilitada (RNE/RNPA) especializada en fabricación a fason de alfajores y galletitas. Calidad, flexibilidad y compromiso con tu marca.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <html lang="es" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body className={`${inter.variable} relative antialiased`}>{children}</body>
      </html>
    </>
  )
}
