"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
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
        setError("Invalid email or password.")
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
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-base text-subtle">
          Enter your credentials to sign in to your account
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-4">
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
          <div className="space-y-1">
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              disabled={isLoading}
              className="h-12 rounded-xl bg-surface border-border/60 focus:border-primary transition-colors"
              required
            />
            <div className="flex justify-end pt-1">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline underline-offset-4 transition-all"
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
          className="h-12 rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="text-center text-sm text-subtle">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold text-primary hover:underline underline-offset-4 transition-all">
          Sign up
        </Link>
      </div>
    </div>
  )
}
