// app/layout.tsx
// Root layout — Server Component
// validateEnv() runs here on every server startup to ensure all required
// environment variables are present before any request is handled.

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { validateEnv } from "@/lib/env"
import "./globals.css"

// Validate environment on every server startup.
// This will throw and halt startup if any required variable is missing.
// Never skip this — a missing FLUTTERWAVE_SECRET_HASH means webhooks
// cannot be verified and bookings can be confirmed fraudulently.
validateEnv()

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "BookMe — Payment-Confirmed Bookings for Event Vendors",
  description:
    "BookMe lets event vendors receive payment-confirmed bookings through a shareable profile link. No payment, no booking. Eliminate double-bookings and no-shows.",
  keywords: [
    "event booking",
    "vendor booking",
    "photographer booking",
    "event planning Nigeria",
    "deposit booking",
  ],
  openGraph: {
    title: "BookMe — Payment-Confirmed Bookings for Event Vendors",
    description:
      "Share your BookMe link. Let clients book and pay a deposit instantly. Dates are only blocked when payment is confirmed.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
