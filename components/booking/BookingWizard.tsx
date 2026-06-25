"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { Calendar, User, CreditCard, ChevronRight, ChevronLeft, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { validateEmail } from "@/lib/utils"

interface BookingWizardProps {
  vendor: { id: string; name: string }
  service: { id: string; name: string; basePrice: number; depositPercentage: number }
  availableSlots: Array<{ id: string; date: string }>
}

export function BookingWizard({ vendor, service, availableSlots }: BookingWizardProps) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [selectedDateStr, setSelectedDateStr] = React.useState<string | null>(null)
  
  // Form state
  const [clientName, setClientName] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [clientPhone, setClientPhone] = React.useState("")
  const [eventDescription, setEventDescription] = React.useState("")
  
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [emailTouched, setEmailTouched] = React.useState(false)
  const emailError = emailTouched ? validateEmail(clientEmail) : ""

  const depositAmount = Math.floor((service.basePrice * service.depositPercentage) / 100)
  
  const handleNext = () => {
    setError(null)
    if (step === 1 && !selectedDateStr) {
      setError("Please select a date to continue.")
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

  const handleCheckout = async () => {
    if (!selectedDateStr) return
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/bookings/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          serviceId: service.id,
          eventDate: selectedDateStr,
          clientName,
          clientEmail,
          clientPhone,
          eventDescription: eventDescription || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong during checkout.")
      }

      if (data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl
      } else {
        throw new Error("No payment URL received from server.")
      }
    } catch (err) {
      setIsSubmitting(false)
      setError(err instanceof Error ? err.message : "Failed to initiate checkout")
    }
  }

  return (
    <div className="space-y-8">
      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        
        {[
          { num: 1, label: "Select Date", icon: Calendar },
          { num: 2, label: "Your Details", icon: User },
          { num: 3, label: "Payment", icon: CreditCard },
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-background px-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
              step >= s.num 
                ? "bg-primary border-primary text-primary-foreground" 
                : "bg-surface border-muted text-muted-foreground"
            }`}>
              <s.icon className="h-5 w-5" />
            </div>
            <span className={`text-xs font-medium ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
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

      {/* STEP 1: SELECT DATE */}
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div>
            <h2 className="text-xl font-bold">Select an available date</h2>
            <p className="text-sm text-muted-foreground mt-1">
              These are the dates {vendor.name} has opened for bookings.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 pb-2">
            {availableSlots.length > 0 ? (
              availableSlots.map((slot) => {
                const dateObj = parseISO(slot.date)
                const isSelected = selectedDateStr === slot.date
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedDateStr(slot.date)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-surface hover:border-primary/40 hover:bg-surface-variant"
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
                <p className="text-muted-foreground">No available dates found for this vendor.</p>
                <p className="text-xs text-muted-foreground mt-1">Please check back later or contact them directly.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleNext} disabled={!selectedDateStr}>
              Next Step <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: DETAILS */}
      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div>
            <h2 className="text-xl font-bold">Your Details</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Please provide your contact information for this booking.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
              <Input 
                value={clientName} 
                onChange={e => setClientName(e.target.value)} 
                placeholder="e.g. Jane Doe" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address <span className="text-destructive">*</span></label>
              <Input 
                type="email"
                value={clientEmail} 
                onChange={e => { setClientEmail(e.target.value); if (!emailTouched) setEmailTouched(true) }}
                onBlur={() => setEmailTouched(true)}
                error={emailError}
                placeholder="jane@example.com" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number <span className="text-destructive">*</span></label>
              <Input 
                type="tel"
                value={clientPhone} 
                onChange={e => setClientPhone(e.target.value)} 
                placeholder="+234 800 000 0000" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Event Description (Optional)</label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Tell the vendor a little about your event..."
                value={eventDescription}
                onChange={e => setEventDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleNext}>
              Next Step <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: SUMMARY */}
      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div>
            <h2 className="text-xl font-bold">Booking Summary</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Review your booking details and pay the deposit to lock in your date.
            </p>
          </div>

          <Card className="bg-surface/50 border-border/60">
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Service</p>
                  <p className="font-semibold text-foreground">{service.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="font-semibold text-foreground">
                    {selectedDateStr && format(parseISO(selectedDateStr), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Your Name</p>
                  <p className="font-semibold text-foreground">{clientName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Your Email</p>
                  <p className="font-semibold text-foreground">{clientEmail}</p>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Price</span>
                  <span className="font-medium">₦{(service.basePrice / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit Required ({service.depositPercentage}%)</span>
                  <span className="font-medium">₦{(depositAmount / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border/50">
                  <span className="font-bold text-lg">Total Due Now</span>
                  <span className="font-bold text-xl text-primary">₦{(depositAmount / 100).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-secondary/10 p-4 rounded-xl text-sm text-secondary-foreground">
            <p className="font-medium mb-1">Payment confirms your booking.</p>
            <p className="text-xs opacity-90">
              Once you proceed, this date will be locked for 15 minutes. Your booking will be fully confirmed once payment is successful.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleCheckout} disabled={isSubmitting} className="min-w-[150px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay Deposit & Book"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
