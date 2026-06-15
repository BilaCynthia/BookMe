// lib/env.ts
// Environment Variable Validation
//
// Call validateEnv() at application startup (app/layout.tsx server side).
// If any required variable is missing or empty, this throws a descriptive
// error that halts startup immediately — preventing silent failures where
// the app runs but payments fail, auth breaks, or emails never send.

const REQUIRED_ENV_VARS = [
  {
    key: "DATABASE_URL",
    description: "PostgreSQL connection string (Neon pooled URL)",
  },
  {
    key: "DIRECT_URL",
    description:
      "PostgreSQL direct connection string (Neon direct URL — used by Prisma migrations)",
  },
  {
    key: "NEXTAUTH_URL",
    description:
      "Full URL of this application (e.g. https://bookme.vercel.app or http://localhost:3000)",
  },
  {
    key: "NEXTAUTH_SECRET",
    description:
      "Random secret for signing NextAuth JWTs — generate with: openssl rand -base64 32",
  },
  {
    key: "GOOGLE_CLIENT_ID",
    description: "Google OAuth client ID from Google Cloud Console",
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    description: "Google OAuth client secret from Google Cloud Console",
  },
  {
    key: "FLUTTERWAVE_PUBLIC_KEY",
    description: "Flutterwave public key (FLWPUBK_TEST_... or FLWPUBK_...)",
  },
  {
    key: "FLUTTERWAVE_SECRET_KEY",
    description:
      "Flutterwave secret key — server-side only, never expose to client",
  },
  {
    key: "FLUTTERWAVE_SECRET_HASH",
    description:
      "Flutterwave webhook secret hash — used to verify incoming webhook signatures",
  },
  {
    key: "RESEND_API_KEY",
    description: "Resend API key for transactional email sending",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    description:
      "Public base URL of this app — used in email links and Flutterwave redirect URLs",
  },
] as const

type EnvKey = (typeof REQUIRED_ENV_VARS)[number]["key"]

/**
 * Validates that all required environment variables are present and non-empty.
 * Call this once at application startup in app/layout.tsx.
 *
 * Throws a descriptive error listing every missing variable if any are absent.
 * In production, this prevents deploying a broken configuration silently.
 */
export function validateEnv(): void {
  const missing: string[] = []

  for (const { key, description } of REQUIRED_ENV_VARS) {
    const value = process.env[key]
    if (!value || value.trim() === "") {
      missing.push(`  - ${key}: ${description}`)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `BookMe startup failed — missing required environment variables:\n\n${missing.join("\n")}\n\n` +
        `Copy .env.example to .env.local and fill in the missing values.\n` +
        `See https://github.com/bookme/bookme for setup instructions.`
    )
  }
}

/**
 * Type-safe environment variable accessor.
 * Throws if the variable is not set (should never happen after validateEnv()).
 */
export function getEnv(key: EnvKey): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Environment variable ${key} is not set. Did you call validateEnv() at startup?`
    )
  }
  return value
}
