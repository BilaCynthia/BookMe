"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Mail, CheckCircle2 } from "lucide-react"

export default function ClientPortalLoginPage() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState(searchParams.get("error") || "")
  const [success, setSuccess] = React.useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string

    try {
      const res = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send login link")
      }

      setSuccess(true)
    } catch (err: unknown) {
      setError((err as Error).message || String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-primary/5 pattern-dots pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl font-bold text-foreground">Client Portal</h1>
          <p className="text-subtle">Manage your bookings & payments seamlessly.</p>
        </div>

        <Card className="border-border/40 bg-surface/80 backdrop-blur-xl shadow-2xl overflow-hidden rounded-[2rem]">
          {success ? (
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Check your email</h3>
                <p className="text-subtle">
                  We&apos;ve sent a magic link to your inbox. Click the link to securely sign in.
                </p>
              </div>
              <p className="text-xs text-muted-foreground pt-4">
                You can safely close this window.
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter the email address you used to book your vendor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-center">
                      {error === "InvalidToken" ? "Your magic link expired or is invalid. Please request a new one." 
                        : error === "MissingToken" ? "Invalid login link." 
                        : error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        name="email" 
                        type="email" 
                        placeholder="you@example.com" 
                        required 
                        className="pl-10 h-12 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    fullWidth 
                    isLoading={isLoading}
                    className="h-12 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  >
                    Send Magic Link
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
