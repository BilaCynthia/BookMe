---
trigger: always_on
---

# BookMe — Code Style Rules

## Core Principles

1. **Correctness over cleverness.** Booking and payment logic must be readable and auditable. No clever one-liners where a clear 3-liner exists.
2. **Fail loudly, fail early.** Validate inputs at the boundary. Throw typed errors. Never silently swallow exceptions.
3. **Types are documentation.** Every function signature, API response, and database result must be typed. The type system is the first layer of documentation.
4. **Explicit over implicit.** State machine transitions, booking status changes, and payment events must be deliberately named and explicitly invoked.

---

## TypeScript

```typescript
// ✅ Always use strict TypeScript — no implicit any
// tsconfig.json must have: "strict": true

// ✅ Define types for every function parameter and return value
async function initiateBooking(
  params: BookingInitiationParams
): Promise<BookingInitiationResult> { ... }

// ✅ Use discriminated unions for result types
type BookingResult =
  | { success: true; booking: Booking; paymentUrl: string }
  | { success: false; error: "DATE_UNAVAILABLE" | "SERVICE_INACTIVE" | "VALIDATION_ERROR" }

// ✅ Prefer interfaces for object shapes, types for unions/primitives
interface BookingInitiationParams {
  vendorId: string
  serviceId: string
  eventDate: string
  clientName: string
  clientEmail: string
  clientPhone: string
  eventDescription?: string
}

// ❌ Never
const result: any = await db.query(...)
// @ts-ignore
const amount = booking.depositAmount
```

---

## File & Folder Naming

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `BookingCard.tsx` |
| Utility files | kebab-case | `format-money.ts` |
| API route files | `route.ts` inside folder | `app/api/bookings/initiate/route.ts` |
| Type files | kebab-case | `booking-types.ts` |
| Hooks | camelCase prefixed with `use` | `useBookingStatus.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PORTFOLIO_IMAGES = 10` |
| Zod schemas | camelCase suffixed with `Schema` | `bookingInitiationSchema` |
| Prisma models | PascalCase (follows Prisma convention) | `Booking`, `AvailabilitySlot` |

---

## Component Patterns

### Server Components (default in App Router)

```typescript
// ✅ Server Component — no "use client" directive needed
// Fetch data directly, no useEffect
export default async function VendorProfile({ params }: { params: { slug: string } }) {
  const vendor = await getVendorBySlug(params.slug)
  if (!vendor) notFound()

  return <ProfileView vendor={vendor} />
}
```

### Client Components

```typescript
// ✅ Client Component — only when interactivity is needed
"use client"

import { useState } from "react"

interface BookingCalendarProps {
  availableDates: string[]
  onDateSelect: (date: string) => void
}

export function BookingCalendar({ availableDates, onDateSelect }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  // ...
}
```

**Rules:**
- Default to Server Components. Only add `"use client"` when the component needs state, effects, or browser APIs.
- Never fetch data inside a Client Component when a Server Component can pass it as props.
- Keep Client Components as leaf nodes in the tree (push `"use client"` as far down as possible).

---

## API Route Pattern

Every API route must follow this exact structure:

```typescript
// app/api/bookings/initiate/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

// 1. Define Zod schema at the top of the file
const bookingInitiationSchema = z.object({
  vendorId: z.string().cuid(),
  serviceId: z.string().cuid(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clientName: z.string().min(2).max(100),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(7).max(20),
  eventDescription: z.string().max(200).optional(),
})

// 2. Export named HTTP method handler
export async function POST(request: NextRequest) {
  try {
    // 3. Parse and validate input
    const body = await request.json()
    const parsed = bookingInitiationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    // 4. Auth check (if required)
    // const session = await auth()
    // if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

    // 5. Business logic
    const result = await initiateBooking(parsed.data)

    // 6. Return typed response
    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    logger.error("booking.initiate.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
```

---

## Money Handling

```typescript
// ✅ Always work in kobo (integer)
const basePriceKobo = 15000000  // NGN 150,000

// ✅ Use this utility for display
export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100)
}
// formatNaira(15000000) → "₦150,000"

// ✅ Calculate deposit amount (always integer, no floats)
export function calculateDeposit(basePriceKobo: number, depositPercent: number): number {
  return Math.floor((basePriceKobo * depositPercent) / 100)
}

// ✅ Convert kobo to naira for Flutterwave (expects naira)
export function koboToNaira(kobo: number): number {
  return kobo / 100
}

// ❌ Never
const depositAmount = booking.basePrice * 0.3  // floating point
const price = 150000.50  // decimal money
```

---

## Error Handling

```typescript
// ✅ Define typed error classes
export class BookingError extends Error {
  constructor(
    public readonly code: BookingErrorCode,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = "BookingError"
  }
}

export type BookingErrorCode =
  | "DATE_UNAVAILABLE"
  | "SERVICE_INACTIVE"
  | "VENDOR_NOT_FOUND"
  | "PAYMENT_FAILED"
  | "BOOKING_NOT_FOUND"
  | "AMOUNT_MISMATCH"

// ✅ Throw typed errors in business logic
if (!availabilitySlot) {
  throw new BookingError("DATE_UNAVAILABLE", "This date is no longer available.", 409)
}

// ✅ Catch and map in API route handler
} catch (error) {
  if (error instanceof BookingError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.statusCode }
    )
  }
  logger.error("unexpected.error", error as Error)
  return NextResponse.json({ error: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 })
}

// ❌ Never
} catch (e) {
  res.json({ error: e.message })  // exposes internal details
}
```

---

## Prisma Usage

```typescript
// ✅ Use the singleton client
import { prisma } from "@/lib/prisma"

// ✅ Always use transactions for multi-step operations
await prisma.$transaction(async (tx) => {
  await tx.booking.update({ ... })
  await tx.availabilitySlot.update({ ... })
  await tx.payment.create({ ... })
})

// ✅ Select only needed fields
const vendor = await prisma.vendor.findUnique({
  where: { slug },
  select: {
    id: true,
    businessName: true,
    bio: true,
    services: { where: { isActive: true } },
  },
})

// ❌ Never fetch entire records when you need a subset
const vendor = await prisma.vendor.findUnique({ where: { slug } })
// then access vendor.someField — fetched all fields unnecessarily

// ✅ Use raw SQL only when Prisma cannot express it (e.g., SELECT FOR UPDATE)
const result = await prisma.$executeRaw`
  SELECT id FROM "AvailabilitySlot"
  WHERE "vendorId" = ${vendorId}
    AND date = ${date}::date
    AND status = 'OPEN'
  FOR UPDATE NOWAIT
`
```

---

## Logging

```typescript
// lib/logger.ts — structured logging only
export const logger = {
  info: (event: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: "info", event, ...meta, ts: new Date().toISOString() })),

  error: (event: string, error?: Error, meta?: Record<string, unknown>) =>
    console.error(JSON.stringify({
      level: "error",
      event,
      message: error?.message,
      stack: error?.stack,
      ...meta,
      ts: new Date().toISOString(),
    })),

  warn: (event: string, meta?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: "warn", event, ...meta, ts: new Date().toISOString() })),
}

// ✅ Usage
logger.info("booking.initiated", { bookingId, vendorId, eventDate })
logger.error("webhook.processing.failed", error, { txRef, attempt })

// ❌ Never
console.log("booking created", booking)
console.error(error)
```

---

## Naming Conventions for Domain Concepts

Always use these exact names consistently across code, comments, and logs:

| Concept | Correct Name | Never Use |
|---|---|---|
| Person booking | `client` | `customer`, `user`, `buyer` |
| Person offering services | `vendor` | `seller`, `provider`, `merchant` |
| Flutterwave transaction ref | `txRef` | `transactionId`, `paymentRef`, `ref` |
| Date state: available | `OPEN` | `available`, `free`, `active` |
| Date state: payment pending | `PENDING_LOCK` | `locked`, `held`, `pending` |
| Date state: payment confirmed | `BLOCKED` | `booked`, `taken`, `reserved` |
| Date state: manually closed | `CLOSED` | `unavailable`, `disabled` |
| Booking status after payment | `CONFIRMED` | `paid`, `booked`, `active` |
| Money unit | `kobo` suffix (e.g., `basePriceKobo`) | `amount`, `price` (ambiguous) |

---

## Imports & Module Organisation

```typescript
// ✅ Import order (enforced by ESLint):
// 1. React / Next.js
import { useState } from "react"
import { NextRequest, NextResponse } from "next/server"

// 2. External packages
import { z } from "zod"
import { prisma } from "@/lib/prisma"

// 3. Internal — lib
import { logger } from "@/lib/logger"
import { formatNaira } from "@/lib/utils/money"

// 4. Internal — components
import { BookingCard } from "@/components/booking/BookingCard"

// 5. Types
import type { Booking, Vendor } from "@/types"

// ✅ Use path aliases — never relative imports more than one level deep
import { prisma } from "@/lib/prisma"  // ✅
import { prisma } from "../../../lib/prisma"  // ❌
```

---

## Testing Expectations

- Business logic functions in `lib/` must be unit-testable (pure functions preferred)
- Payment and booking flow logic should have integration tests against a test database
- Webhook handler must be tested with mock Flutterwave payloads
- Use `vitest` as the test runner
- Test file co-located: `lib/booking/initiate-booking.test.ts` alongside `lib/booking/initiate-booking.ts`