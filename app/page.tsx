import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { BenefitsSection } from "@/components/benefits-section"
import { ProcessSection } from "@/components/process-section"
import { ProductsSection } from "@/components/products-section"
import { CertificationsSection } from "@/components/certifications-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { ContactSection } from "@/components/contact-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <BenefitsSection />
      <ProcessSection />
      <ProductsSection />
      <CertificationsSection />
      <TestimonialsSection />
      <ContactSection />
      <CTASection />
      <Footer />
    </main>
  )
}
