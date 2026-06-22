import { Hero } from "@/components/landing/Hero"
import { FadeIn } from "@/components/ui/FadeIn"
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
      <FadeIn>
        <ProblemSection />
      </FadeIn>
      <FadeIn>
        <HowItWorks />
      </FadeIn>
      <FadeIn>
        <Features />
      </FadeIn>
      <FadeIn>
        <VendorCategories />
      </FadeIn>
      <FadeIn>
        <ForClients />
      </FadeIn>
      <FadeIn>
        <Testimonials />
      </FadeIn>
      <FadeIn>
        <Pricing />
      </FadeIn>
      <FadeIn>
        <FAQ />
      </FadeIn>
      <FadeIn>
        <FinalCTA />
      </FadeIn>
    </>
  )
}
