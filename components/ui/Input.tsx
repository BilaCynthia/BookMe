"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const isError = !!error
    const isPassword = type === "password"
    const [showPassword, setShowPassword] = React.useState(false)

    const actualType = isPassword ? (showPassword ? "text" : "password") : type

    return (
      <div className="flex w-full flex-col">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block w-full cursor-pointer pb-2 pt-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              isError && "text-destructive"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={actualType}
            id={inputId}
            className={cn(
              "flex h-11 min-h-[44px] w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              isError ? "border-destructive focus-visible:ring-destructive" : "border-input",
              isPassword && "pr-10",
              className
            )}
            ref={ref}
            aria-invalid={isError ? "true" : "false"}
            aria-describedby={
              [isError ? errorId : undefined, helperText ? helperId : undefined]
                .filter(Boolean)
                .join(" ") || undefined
            }
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
