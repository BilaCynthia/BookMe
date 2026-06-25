"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { Calendar, User, Send, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { validateEmail } from "@/lib/utils"

interface QuoteRequestFormProps {
  vendor: { id: string; name: string }
  service: { id: string; name: string }
  availableSlots: Array<{ id: string; date: string }>
}

export function QuoteRequestForm({ vendor, service, availableSlots }: QuoteRequestFormProps) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [selectedDateStr, setSelectedDateStr] = React.useState<string | null>(null)

  const [clientName, setClientName] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [clientPhone, setClientPhone] = React.useState("")
  const [eventType, setEventType] = React.useState("")
  const [guestCount, setGuestCount] = React.useState("")
  const [requirements, setRequirements] = React.useState("")

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [emailTouched, setEmailTouched] = React.useState(false)
  const emailError = emailTouched ? validateEmail(clientEmail) : ""

  const handleNext = () => {
    setError(null)
    if (step === 1 && !selectedDateStr) {
      setError("Please select a preferred date to continue.")
      return
    }
    if (step === 2) {
      if (!clientName || !clientEmail || !clientPhone) {
        setError("Please fill in all required fields.")
        return
      }
      if (!clientEmail.includes("@") || validateEmail(clientEmail)) {
        setError("Please enter a valid email address.")
        setEmailTouched(true)
        return
      }
    }
    setStep((s) => (s + 1) as 1 | 2 | 3)
  }

  const handleBack = () => {
    setError(null)
    setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)
  }

  const handleSubmit = async () => {
    if (!requirements.trim() || requirements.trim().length < 10) {
      setError("Please provide more detail about your requirements (min 10 characters).")
      return
    }
    if (!selectedDateStr) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          serviceId: service.id,
          clientName,
          clientEmail,
          clientPhone,
          requestedDate: selectedDateStr,
          requirements,
          guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
          eventType: eventType || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to submit quote request")

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground">Quote Request Sent!</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Your request has been sent to <strong>{vendor.name}</strong>. You&apos;ll receive their quote by email — check your inbox.
        </p>
        <p className="text-xs text-muted-foreground">No payment is required until you accept the quote.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-8">
      {/* Steps */}
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        {[
          { num: 1, label: "Preferred Date", icon: Calendar },
          { num: 2, label: "Your Details", icon: User },
          { num: 3, label: "Requirements", icon: Send },
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-surface px-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
              step >= s.num ? "bg-primary border-primary text-primary-foreground" : "bg-surface border-muted text-muted-foreground"
            }`}>
              <s.icon className="h-5 w-5" />
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* STEP 1: DATE */}
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div>
            <h2 className="text-xl font-bold">Select a preferred date</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This is your preferred date. It won&apos;t be blocked until you pay the deposit after receiving a quote.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {availableSlots.length > 0 ? (
              availableSlots.map((slot) => {
                const dateObj = parseISO(slot.date)
                const isSelected = selectedDateStr === slot.date
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedDateStr(slot.date)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      isSelected ? "border-primary bg-primary/5 text-primary" : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <span className="text-sm font-medium">{format(dateObj, "MMM")}</span>
                    <span className="text-2xl font-bold">{format(dateObj, "d")}</span>
                    <span className="text-xs text-muted-foreground mt-1">{format(dateObj, "EEEE")}</span>
                  </button>
                )
              })
            ) : (
              <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">No open dates at this time.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleNext} disabled={!selectedDateStr}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: DETAILS */}
      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div>
            <h2 className="text-xl font-bold">Your Details</h2>
            <p className="text-sm text-muted-foreground mt-1">How should the vendor contact you?</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Jane Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address <span className="text-destructive">*</span></label>
              <Input type="email" value={clientEmail} onChange={(e) => { setClientEmail(e.target.value); if (!emailTouched) setEmailTouched(true) }} onBlur={() => setEmailTouched(true)} error={emailError} placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number <span className="text-destructive">*</span></label>
              <Input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+234 800 000 0000" />
            </div>
          </div>
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleBack}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button onClick={handleNext}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* STEP 3: REQUIREMENTS */}
      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div>
            <h2 className="text-xl font-bold">Tell them about your event</h2>
            <p className="text-sm text-muted-foreground mt-1">The more detail you provide, the more accurate the quote.</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <Input value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="e.g. Wedding, Birthday" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Guest Count</label>
                <Input type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="e.g. 200" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Requirements & Additional Details <span className="text-destructive">*</span>
              </label>
              <textarea
                className="flex min-h-[160px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all resize-none"
                placeholder="Describe your event, menu preferences, special requirements, setup details, etc."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{requirements.length}/1000</p>
            </div>
          </div>
          <div className="bg-secondary/10 p-4 rounded-xl text-sm text-secondary-foreground">
            <p className="font-medium mb-1">No payment required yet.</p>
            <p className="text-xs opacity-90">
              Submitting this form sends your request to {vendor.name}. You&apos;ll only pay after receiving and accepting their quote.
            </p>
          </div>
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} isLoading={isSubmitting}>
              {!isSubmitting && <Send className="mr-2 h-4 w-4" />}
              Submit Quote Request
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
