"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SessionProvider, useSession } from "next-auth/react"
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

const categories = [
  { value: "PHOTOGRAPHER", label: "Photographer", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400" },
  { value: "VIDEOGRAPHER", label: "Videographer", image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=400" },
  { value: "DECORATOR", label: "Decorator", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400" },
  { value: "CATERER", label: "Caterer", image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=400" },
  { value: "MC_DJ", label: "MC / DJ", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400" },
  { value: "MAKEUP_ARTIST", label: "Makeup Artist", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80&w=400" },
  { value: "EVENT_PLANNER", label: "Event Planner", image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=400" },
  { value: "OTHER", label: "Other", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400" },
]

function OnboardingForm() {
  const router = useRouter()
  const { update } = useSession()
  const [step, setStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const [formData, setFormData] = React.useState({
    category: "",
    location: "",
    whatsappNumber: "",
    instagramHandle: "",
    bio: "",
  })

  function handleNext() {
    setError("")
    if (step === 1) {
      if (!formData.category) {
        setError("Please select a category to continue.")
        return
      }
    } else if (step === 2) {
      if (!formData.location || !formData.whatsappNumber) {
        setError("Please fill in your city and WhatsApp number.")
        return
      }
    }
    setStep((s) => s + 1)
  }

  function handleBack() {
    setError("")
    setStep((s) => s - 1)
  }

  async function handleSubmit() {
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/vendors/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Failed to save profile.")
        setIsLoading(false)
        return
      }

      await update({ profileCompleted: true })

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 sm:p-8">
      {/* Subtle Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-[560px]">
        <header className="mb-10 flex w-full items-center justify-center">
          <Link href="/" className="group flex items-center space-x-3 text-primary">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <span className="text-xl font-bold">B</span>
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight">BookMe</span>
          </Link>
        </header>

        <div className="w-full space-y-8 rounded-3xl bg-surface/80 p-6 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-700 sm:p-10">
          
          {/* Progress Indicator */}
          <div className="mb-2 flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("h-2 flex-1 rounded-full transition-all duration-500", step >= i ? "bg-primary" : "bg-muted")} />
            ))}
          </div>

          <div className="space-y-2 text-center">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {step === 1 && "What services do you provide?"}
              {step === 2 && "Where can clients find you?"}
              {step === 3 && "Tell us about yourself"}
            </h1>
            <p className="text-base text-subtle">
              {step === 1 && "Select the main category that best describes your event business."}
              {step === 2 && "Add your contact details so clients can easily reach you."}
              {step === 3 && "This will appear on your public booking page."}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-in fade-in slide-in-from-right-8 duration-500">
              {categories.map((c) => {
                const isSelected = formData.category === c.value
                return (
                  <button
                    key={c.value}
                    onClick={() => setFormData({ ...formData, category: c.value })}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-2xl border border-transparent transition-all duration-300 focus:outline-none",
                      isSelected 
                        ? "shadow-md ring-2 ring-primary ring-offset-2" 
                        : "hover:ring-2 hover:ring-primary/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm animate-in zoom-in">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                    <div className="relative aspect-square w-full overflow-hidden">
                      <img 
                        src={c.image} 
                        alt={c.label} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                        <span className="text-sm font-semibold text-white drop-shadow-md">
                          {c.label}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
              <Input
                label="Primary City/Location"
                placeholder="E.g., Lagos, Abuja, Port Harcourt"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-12 rounded-xl bg-background border-transparent focus:border-transparent focus:ring-2 focus:ring-primary transition-colors"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="WhatsApp Number"
                  type="tel"
                  placeholder="08012345678"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="h-12 rounded-xl bg-background border-transparent focus:border-transparent focus:ring-2 focus:ring-primary transition-colors"
                />
                <Input
                  label="Instagram Handle"
                  placeholder="@your_handle"
                  value={formData.instagramHandle}
                  onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                  className="h-12 rounded-xl bg-background border-transparent focus:border-transparent focus:ring-2 focus:ring-primary transition-colors"
                />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground">Professional Bio</label>
                <textarea
                  className="flex min-h-[140px] w-full resize-none rounded-xl border-transparent bg-background px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  placeholder="I am a professional photographer with 5 years of experience specializing in weddings and portrait photography..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="flex items-center justify-between pt-6">
            {step > 1 ? (
              <Button variant="ghost" onClick={handleBack} disabled={isLoading} className="gap-2 h-12 rounded-xl px-6">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button onClick={handleNext} className="gap-2 h-12 rounded-xl px-8 shadow-md hover:shadow-lg transition-all ml-auto">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} isLoading={isLoading} className="gap-2 h-12 rounded-xl px-8 shadow-md hover:shadow-lg transition-all ml-auto">
                {isLoading ? "Setting up..." : "Complete Setup"} <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <SessionProvider>
      <OnboardingForm />
    </SessionProvider>
  )
}
