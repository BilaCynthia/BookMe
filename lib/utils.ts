import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates an email address in real-time as the user types.
 * Returns an error message string, or empty string if valid.
 * Only shows an error once the user has started typing (non-empty value).
 */
export function validateEmail(value: string): string {
  if (!value) return ""
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return "Please enter a valid email address (e.g. name@example.com)"
  }
  return ""
}
