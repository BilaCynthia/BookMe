"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [error, setError] = React.useState("")

  if (!token) {
    return (
      <div className="flex w-full max-w-md flex-col items-center justify-center space-y-6 text-center sm:w-[350px]">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invalid Reset Link</h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or missing the required token.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.details) {
          const firstError = Object.values(data.details)[0]
          throw new Error(Array.isArray(firstError) ? firstError[0] : "Invalid password format")
        }
        throw new Error(data.message || "Failed to reset password")
      }

      setIsSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex w-full max-w-md flex-col items-center justify-center space-y-6 text-center sm:w-[350px]">
        <CheckCircle2 className="h-16 w-16 text-emerald-600" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Password Reset Complete</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been successfully updated. You will be redirected to the login page momentarily.
          </p>
        </div>
        <Button asChild className="w-full mt-4">
          <Link href="/login">
            Go to Login <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
          Create New Password
        </h1>
        <p className="text-base text-subtle">
          Please enter your new password below.
        </p>
      </div>

      <div className="grid gap-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input
                id="password"
                type="password"
                label="New Password"
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-surface border-border/60 focus:border-primary transition-colors"
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1 px-1">
                Must be at least 8 characters and include a number, uppercase letter, and special character.
              </p>
            </div>

            <div className="grid gap-2">
              <Input
                id="confirmPassword"
                type="password"
                label="Confirm New Password"
                disabled={isSubmitting}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              disabled={isSubmitting || !password || !confirmPassword} 
              isLoading={isSubmitting}
              className="h-12 rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg mt-2"
            >
              Reset Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="flex w-full items-center justify-center p-8 text-muted-foreground">Loading...</div>}>
      <ResetPasswordContent />
    </React.Suspense>
  )
}
