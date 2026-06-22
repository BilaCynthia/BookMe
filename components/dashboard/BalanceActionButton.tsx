"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface BalanceActionButtonProps {
  bookingId: string
  formattedAmount: string
}

export function BalanceActionButton({ bookingId, formattedAmount }: BalanceActionButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  const handleMarkPaid = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/bookings/balance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      })

      if (!res.ok) {
        throw new Error("Failed to mark balance as paid")
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      // Normally we'd show a toast here, but simple alert for MVP
      alert("Failed to mark balance as paid. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <span className="font-semibold text-foreground">
        {formattedAmount}
      </span>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 text-xs border-primary/20 text-primary hover:bg-primary/10"
        onClick={handleMarkPaid}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-1 h-3 w-3" />
        )}
        Mark Paid
      </Button>
    </div>
  )
}
