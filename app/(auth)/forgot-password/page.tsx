"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        throw new Error("Failed to send reset email")
      }

      setIsSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
          Forgot Password
        </h1>
        <p className="text-base text-subtle">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="grid gap-6">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-emerald-100 bg-emerald-50 p-6 text-center dark:border-emerald-900/50 dark:bg-emerald-900/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-500" />
            <div className="space-y-1">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-400">Check your email</h3>
              <p className="text-sm text-emerald-700/80 dark:text-emerald-500/80">
                We&apos;ve sent a password reset link to <span className="font-medium">{email}</span>
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
              onClick={() => setIsSubmitted(false)}
            >
              Try another email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  placeholder="m@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-surface border-border/60 focus:border-primary transition-colors"
                  required
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button 
                disabled={isSubmitting || !email} 
                isLoading={isSubmitting}
                className="h-12 rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg mt-2"
              >
                Send Reset Link
              </Button>
            </div>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
