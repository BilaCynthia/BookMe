"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface PayoutSettingsCardProps {
  hasSubaccount: boolean
}

export function PayoutSettingsCard({ hasSubaccount }: PayoutSettingsCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const account_bank = formData.get("account_bank") as string
    const account_number = formData.get("account_number") as string

    try {
      const res = await fetch("/api/vendors/payout-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_bank, account_number }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to set up payouts")
      }

      setSuccess(true)
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message || String(err))
    } finally {
      setIsLoading(false)
    }
  }

  if (hasSubaccount || success) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Payouts Configured
          </CardTitle>
          <CardDescription>
            Your automated split payouts are successfully configured. 95% of all deposits will be routed directly to your bank account.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-secondary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-secondary" />
          Set up Payouts
        </CardTitle>
        <CardDescription>
          Enter your Nigerian bank account details. We will automatically route 95% of your clients&apos; deposits directly to this account upon booking confirmation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Bank Code</label>
            <Input 
              name="account_bank" 
              placeholder="e.g. 044 (Access Bank), 058 (GTB)" 
              disabled={isLoading}
              required 
            />
            <p className="text-[10px] text-muted-foreground">
              Please enter the 3-digit CBN bank code.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Account Number</label>
            <Input 
              name="account_number" 
              placeholder="0690000031" 
              minLength={10}
              maxLength={10}
              disabled={isLoading}
              required 
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={isLoading}>
            Connect Bank Account
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
