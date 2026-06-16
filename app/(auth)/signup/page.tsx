"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      setIsLoading(false)
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.")
      setIsLoading(false)
      return
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.")
      setIsLoading(false)
      return
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain at least one special character.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Registration failed.")
        setIsLoading(false)
        return
      }

      // Automatically sign in after registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        setError("Failed to sign in automatically. Please log in.")
      } else {
        router.push("/onboarding")
        router.refresh()
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-base text-subtle">
          Enter your details below to create your account
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-4">
          <Input
            id="name"
            name="name"
            type="text"
            label="Name"
            placeholder="John Doe or Emeka Photography"
            disabled={isLoading}
            className="h-12 rounded-xl bg-surface border-border/60 focus:border-primary transition-colors"
            required
          />
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="m@example.com"
            autoComplete="email"
            disabled={isLoading}
            className="h-12 rounded-xl bg-surface border-border/60 focus:border-primary transition-colors"
            required
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            disabled={isLoading}
            className="h-12 rounded-xl bg-surface border-border/60 focus:border-primary transition-colors"
            required
          />
        </div>

        {error && (
          <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            {error}
          </p>
        )}

        <Button 
          type="submit" 
          fullWidth 
          isLoading={isLoading} 
          className="h-12 rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg mt-2"
        >
          Sign Up
        </Button>
      </form>

      <div className="text-center text-sm text-subtle">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline underline-offset-4 transition-all">
          Sign in
        </Link>
      </div>
    </div>
  )
}
