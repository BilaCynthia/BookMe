import { Hero } from "@/components/landing/Hero"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Features } from "@/components/landing/Features"
import { VendorCategories } from "@/components/landing/VendorCategories"
import { ForClients } from "@/components/landing/ForClients"
import { Testimonials } from "@/components/landing/Testimonials"
import { Pricing } from "@/components/landing/Pricing"
import { FAQ } from "@/components/landing/FAQ"
import { FinalCTA } from "@/components/landing/FinalCTA"

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <VendorCategories />
      <ForClients />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  )
}
