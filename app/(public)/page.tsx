import dynamic from "next/dynamic"
import { Hero } from "@/components/landing/Hero"
import { FadeIn } from "@/components/ui/FadeIn"

// Lazily load all below-the-fold sections. 
// This drastically speeds up initial development compilation and production TTI (Time to Interactive).
const ProblemSection = dynamic(() => import("@/components/landing/ProblemSection").then(mod => mod.ProblemSection))
const HowItWorks = dynamic(() => import("@/components/landing/HowItWorks").then(mod => mod.HowItWorks))
const Features = dynamic(() => import("@/components/landing/Features").then(mod => mod.Features))
const VendorCategories = dynamic(() => import("@/components/landing/VendorCategories").then(mod => mod.VendorCategories))
const ForClients = dynamic(() => import("@/components/landing/ForClients").then(mod => mod.ForClients))
const Testimonials = dynamic(() => import("@/components/landing/Testimonials").then(mod => mod.Testimonials))
const Pricing = dynamic(() => import("@/components/landing/Pricing").then(mod => mod.Pricing))
const FAQ = dynamic(() => import("@/components/landing/FAQ").then(mod => mod.FAQ))
const FinalCTA = dynamic(() => import("@/components/landing/FinalCTA").then(mod => mod.FinalCTA))

export default function LandingPage() {
  return (
    <>
      <FadeIn direction="up" duration={1.2} viewAmount="some">
        <Hero />
      </FadeIn>
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
