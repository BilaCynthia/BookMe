"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { CreditCard } from "lucide-react"

interface BalanceCheckoutFormProps {
  bookingId: string
}

export function BalanceCheckoutForm({ bookingId }: BalanceCheckoutFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  async function handleCheckout() {
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/bookings/${bookingId}/pay-balance`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to initiate payment")
      }

      if (data.paymentUrl) {
        // Redirect to Flutterwave secure checkout
        window.location.href = data.paymentUrl
      }
    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}
      <Button 
        onClick={handleCheckout} 
        fullWidth 
        isLoading={isLoading}
        className="h-14 rounded-2xl text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold"
      >
        <CreditCard className="mr-2 h-5 w-5" />
        Pay Securely Now
      </Button>
    </div>
  )
}
