"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"

const categories = [
  { value: "PHOTOGRAPHER", label: "Photographer" },
  { value: "VIDEOGRAPHER", label: "Videographer" },
  { value: "DECORATOR", label: "Decorator" },
  { value: "CATERER", label: "Caterer" },
  { value: "MC_DJ", label: "MC / DJ" },
  { value: "MAKEUP_ARTIST", label: "Makeup Artist" },
  { value: "EVENT_PLANNER", label: "Event Planner" },
  { value: "OTHER", label: "Other" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const [formData, setFormData] = React.useState({
    name: "",
    category: "",
    location: "",
    whatsappNumber: "",
    instagramHandle: "",
    bio: "",
  })

  function handleNext() {
    setError("")
    if (step === 1) {
      if (!formData.name || !formData.category) {
        setError("Please fill in your business name and category.")
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

      // NextAuth requires session update or reload to recognize profileCompleted = true
      // We'll redirect to dashboard, which will trigger a session check.
      // Next.js router.refresh() will also re-fetch server components.
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Complete your profile
          </CardTitle>
          <CardDescription>
            Step {step} of 3
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <Input
                label="Business Name"
                placeholder="E.g., Emeka Photography"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none">Category</label>
                <select
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <Input
                label="City"
                placeholder="E.g., Lagos"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <Input
                label="WhatsApp Number"
                placeholder="08012345678"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              />
              <Input
                label="Instagram Handle (Optional)"
                placeholder="@emeka_photos"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none">Bio (Optional)</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Tell clients a bit about your services..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
          ) : (
            <div /> // Placeholder for flex alignment
          )}

          {step < 3 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={isLoading}>
              Complete Setup
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
