"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function QuotePayButton({ quoteId, depositAmount }: { quoteId: string; depositAmount: number }) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handlePay = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/pay`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to initiate payment")
      if (data.paymentUrl) window.location.href = data.paymentUrl
      else throw new Error("No payment URL received")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">{error}</p>
      )}
      <Button onClick={handlePay} disabled={isLoading} className="w-full h-12 text-base font-semibold">
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
        ) : (
          `Pay Deposit — ₦${(depositAmount / 100).toLocaleString("en-NG")}`
        )}
      </Button>
    </div>
  )
}
