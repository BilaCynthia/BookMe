# Skill: API Route Scaffolder

## Purpose

This skill defines the exact structure, conventions, and patterns for building API routes in BookMe.
Use it whenever you create a new `route.ts` file under `app/api/`.

---

## When to Use This Skill

- Creating any new API endpoint
- Adding a new HTTP method to an existing route file
- Building webhook handlers
- Creating cron job endpoints
- Scaffolding CRUD operations for vendors, services, bookings, availability

---

## Route File Location Convention

```
app/api/
├── auth/
│   └── [...nextauth]/route.ts       # NextAuth handler — do not touch
├── vendors/
│   ├── route.ts                     # GET (public profile list — not needed MVP)
│   ├── [slug]/route.ts              # GET public vendor profile
│   ├── profile/route.ts             # GET + PUT (authenticated)
│   ├── portfolio/route.ts           # POST (upload image)
│   └── portfolio/[id]/route.ts      # DELETE (remove image)
├── services/
│   ├── route.ts                     # GET (list) + POST (create)
│   ├── [id]/route.ts                # PUT (update) + DELETE (delete)
│   └── [id]/toggle/route.ts         # PATCH (toggle active)
├── availability/
│   ├── [vendorId]/route.ts          # GET (public — available dates)
│   ├── open/route.ts                # POST (vendor opens dates)
│   └── close/route.ts               # POST (vendor closes dates)
├── bookings/
│   ├── route.ts                     # GET (vendor's bookings — authenticated)
│   ├── initiate/route.ts            # POST (start booking + lock date)
│   └── [reference]/
│       ├── route.ts                 # GET (booking detail — public by reference)
│       └── status/route.ts          # GET (status polling for confirmation page)
├── payments/
│   └── initiate/route.ts            # POST (generate Flutterwave payment link)
├── webhooks/
│   └── flutterwave/route.ts         # POST (payment webhook — see webhook skill)
└── cron/
    └── expire-bookings/route.ts     # GET (Vercel Cron — expire stale bookings)
```

---

## Standard Route Template

Every route file follows this exact pattern:

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { BookingError } from "@/lib/errors"

// ─────────────────────────────────────────────────────────
// INPUT SCHEMA (define at top of file, before handlers)
// ─────────────────────────────────────────────────────────
const createResourceSchema = z.object({
  name: z.string().min(1).max(100),
  // ... all fields with validation rules
})

// ─────────────────────────────────────────────────────────
// GET — List or fetch
// ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    // 1. Auth check (if required)
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    // 2. Query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // 3. Database query
    const items = await prisma.resource.findMany({
      where: { vendorId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    // 4. Return
    return NextResponse.json(items)

  } catch (error) {
    logger.error("resource.list.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────
// POST — Create
// ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    // 2. Parse + validate body
    const body = await request.json()
    const parsed = createResourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    // 3. Business logic
    const resource = await prisma.resource.create({
      data: {
        ...parsed.data,
        vendorId: session.user.id,
      },
    })

    logger.info("resource.created", { resourceId: resource.id, vendorId: session.user.id })

    // 4. Return 201
    return NextResponse.json(resource, { status: 201 })

  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      )
    }
    logger.error("resource.create.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}
```

---

## Dynamic Route Template (with resource ID)

```typescript
// app/api/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

type RouteContext = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    // ✅ Always verify ownership — vendor can only edit their own services
    const existing = await prisma.service.findUnique({
      where: { id: params.id },
      select: { vendorId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    // ✅ Return 404 (not 403) to avoid confirming existence to unauthorised users
    if (existing.vendorId !== session.user.id) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    // ... validation and update logic

  } catch (error) {
    logger.error("service.update.failed", error as Error, { serviceId: params.id })
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const service = await prisma.service.findUnique({
      where: { id: params.id },
      select: {
        vendorId: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: "CONFIRMED",
                eventDate: { gte: new Date() },
              },
            },
          },
        },
      },
    })

    if (!service || service.vendorId !== session.user.id) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    // ✅ Business rule: cannot delete service with confirmed future bookings
    if (service._count.bookings > 0) {
      return NextResponse.json(
        {
          error: "SERVICE_HAS_BOOKINGS",
          message: "Cannot delete a service with upcoming confirmed bookings.",
        },
        { status: 409 }
      )
    }

    await prisma.service.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    logger.error("service.delete.failed", error as Error, { serviceId: params.id })
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 })
  }
}
```

---

## Public Route Template (no auth required)

```typescript
// app/api/availability/[vendorId]/route.ts
// Public endpoint — no auth required — rate limit applies

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addMonths, startOfDay, format } from "date-fns"

type RouteContext = { params: { vendorId: string } }

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const today = startOfDay(new Date())
    const threeMonthsAhead = addMonths(today, 3)

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        vendorId: params.vendorId,
        date: {
          gte: today,
          lte: threeMonthsAhead,
        },
      },
      select: {
        date: true,
        status: true,
      },
      orderBy: { date: "asc" },
    })

    const availableDates = slots
      .filter((s) => s.status === "OPEN")
      .map((s) => format(s.date, "yyyy-MM-dd"))

    const blockedDates = slots
      .filter((s) => s.status === "BLOCKED")
      .map((s) => format(s.date, "yyyy-MM-dd"))

    return NextResponse.json(
      { availableDates, blockedDates },
      {
        headers: {
          // Short cache for public availability — reflect changes quickly
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    )
  } catch (error) {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
```

---

## Cron Job Route Template

```typescript
// app/api/cron/expire-bookings/route.ts
// Called by Vercel Cron every 15 minutes
// Expires PENDING bookings older than 60 minutes and releases date locks

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  // ✅ Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find expired pending bookings
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      select: { id: true, vendorId: true, eventDate: true },
    })

    if (expiredBookings.length === 0) {
      return NextResponse.json({ expired: 0 })
    }

    // Expire bookings and release PENDING_LOCK slots in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update all expired bookings to EXPIRED
      await tx.booking.updateMany({
        where: {
          id: { in: expiredBookings.map((b) => b.id) },
        },
        data: { status: "EXPIRED" },
      })

      // 2. Release PENDING_LOCK on availability slots
      for (const booking of expiredBookings) {
        await tx.availabilitySlot.updateMany({
          where: {
            vendorId: booking.vendorId,
            date: booking.eventDate,
            status: "PENDING_LOCK",
            booking: { id: booking.id },
          },
          data: {
            status: "OPEN",
            bookingId: null,
          },
        })
      }
    })

    logger.info("cron.bookings.expired", { count: expiredBookings.length })

    return NextResponse.json({ expired: expiredBookings.length })

  } catch (error) {
    logger.error("cron.expire.failed", error as Error)
    return NextResponse.json({ error: "CRON_FAILED" }, { status: 500 })
  }
}
```

---

## Response Shape Standards

### Success responses

```typescript
// Single resource
return NextResponse.json(resource, { status: 200 })

// Created resource
return NextResponse.json(resource, { status: 201 })

// Collection
return NextResponse.json({ data: items, total: items.length }, { status: 200 })

// Paginated collection
return NextResponse.json({
  data: items,
  pagination: {
    page: 1,
    perPage: 20,
    total: 47,
    totalPages: 3,
  }
})

// Simple action confirmation
return NextResponse.json({ success: true }, { status: 200 })
```

### Error responses (always this shape)

```typescript
return NextResponse.json(
  {
    error: "ERROR_CODE",           // Machine-readable, SCREAMING_SNAKE_CASE
    message: "Human description",  // Shown to users
    details: {},                   // Optional: field-level errors (Zod)
  },
  { status: 422 }
)
```

---

## What to Never Do

- Never use `export default` for route handlers — always named exports (`GET`, `POST`, etc.)
- Never skip Zod validation on any route that accepts a body
- Never expose raw Prisma/database errors to the client
- Never use `console.log` — use `logger.info` / `logger.error`
- Never skip ownership verification on authenticated resource routes
- Never return a 403 when an authenticated user asks for a resource they don't own — return 404
- Never put database logic directly in the route handler — extract to a `lib/` function for anything beyond simple queries
