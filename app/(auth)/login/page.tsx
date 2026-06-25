"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { validateEmail } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [emailTouched, setEmailTouched] = React.useState(false)
  const emailError = emailTouched ? validateEmail(email) : ""

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const email = (formData.get("email") as string).trim()
    const password = formData.get("password") as string

    if (!email || !password) {
      setError("Please enter your email and password.")
      setIsLoading(false)
      return
    }

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError("Invalid email or password.")
        } else {
          setError(`Login failed: ${res.error}`)
        }
      } else {
        router.push("/dashboard")
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
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-subtle font-medium">
          Enter your credentials to sign in
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-6">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="m@example.com"
            autoComplete="email"
            disabled={isLoading}
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (!emailTouched) setEmailTouched(true) }}
            onBlur={() => setEmailTouched(true)}
            error={emailError}
            className="h-12 rounded-2xl bg-background/50 border-border/40 focus:border-primary focus:bg-background transition-all"
            required
          />
          <div className="space-y-2">
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              disabled={isLoading}
              className="h-12 rounded-2xl bg-background/50 border-border/40 focus:border-primary focus:bg-background transition-all"
              required
            />
            <div className="flex justify-end pt-1">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>
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
          className="h-12 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="text-center text-sm font-medium text-subtle">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold text-primary hover:text-primary-hover transition-colors">
          Sign up
        </Link>
      </div>
    </div>
  )
}
