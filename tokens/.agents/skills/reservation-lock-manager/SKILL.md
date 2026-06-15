# Skill: Reservation Lock Manager

## Purpose

This skill covers the concurrency control mechanism that prevents double-bookings in BookMe.
When two clients attempt to book the same vendor date simultaneously, only one can succeed.
This skill defines exactly how that guarantee is implemented at the database level.

---

## When to Use This Skill

- Implementing or modifying the booking initiation flow
- Debugging a double-booking incident
- Adding any feature that reads or writes `AvailabilitySlot.status`
- Implementing the PENDING_LOCK expiry logic
- Building the cron job that releases stale locks
- Testing concurrency behaviour

---

## The Problem: Race Condition

```
T=0ms   Client A loads vendor profile. Date "2026-09-15" shows OPEN.
T=0ms   Client B loads vendor profile. Date "2026-09-15" shows OPEN.
T=500ms Client A submits booking form.
T=501ms Client B submits booking form.
T=502ms Client A's server: SELECT availability WHERE date='2026-09-15' AND status='OPEN' → found
T=503ms Client B's server: SELECT availability WHERE date='2026-09-15' AND status='OPEN' → found
T=504ms Client A: INSERT booking, UPDATE slot to PENDING_LOCK
T=505ms Client B: INSERT booking, UPDATE slot to PENDING_LOCK  ← DOUBLE BOOKING
```

Without a lock, both transactions read OPEN and proceed to create bookings.

---

## The Solution: Pessimistic Locking

PostgreSQL's `SELECT FOR UPDATE` acquires a row-level lock on the selected rows.
The `NOWAIT` modifier causes the second transaction to **fail immediately** rather than wait.

```
T=502ms Client A: SELECT ... FOR UPDATE NOWAIT → acquires lock on slot row
T=503ms Client B: SELECT ... FOR UPDATE NOWAIT → fails immediately (lock held by A)
T=503ms Client B: receives DATE_UNAVAILABLE error → shown "date just taken" message
T=504ms Client A: creates booking, updates slot to PENDING_LOCK, commits
T=504ms Lock released. Client A has the booking.
```

---

## AvailabilitySlot Status Lifecycle

```
              [Vendor opens date]
                     │
                     ▼
                  ┌──────┐
                  │ OPEN │
                  └──────┘
                  │      │
  [Client starts  │      │  [Vendor closes manually]
   booking flow]  │      │
                  ▼      ▼
          ┌─────────────┐  ┌────────┐
          │PENDING_LOCK │  │ CLOSED │
          └─────────────┘  └────────┘
               │    │
  [Payment     │    │  [No payment — 60 min]
   confirmed]  │    │
               ▼    ▼
           ┌───────┐  ┌──────┐
           │BLOCKED│  │ OPEN │ ← Lock released, date available again
           └───────┘  └──────┘
```

---

## Lock Implementation

### Acquiring the Lock (Booking Initiation)

```typescript
// lib/availability/acquire-slot-lock.ts
import { prisma } from "@/lib/prisma"
import { BookingError } from "@/lib/errors"

interface AcquireSlotLockParams {
  vendorId: string
  date: Date
  bookingId: string
}

/**
 * Attempts to acquire a pessimistic lock on an OPEN availability slot.
 * Uses SELECT FOR UPDATE NOWAIT — fails immediately if another transaction holds the lock.
 * Must be called INSIDE a Prisma transaction.
 */
export async function acquireSlotLock(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: AcquireSlotLockParams
): Promise<string> {
  // Attempt to lock the row
  const result = await tx.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM "availability_slots"
    WHERE "vendorId" = ${params.vendorId}
      AND date = ${params.date}::date
      AND status = 'OPEN'::"AvailabilityStatus"
    FOR UPDATE NOWAIT
  `

  if (result.length === 0) {
    throw new BookingError(
      "DATE_UNAVAILABLE",
      "This date is no longer available. Please select another date.",
      409
    )
  }

  const slotId = result[0].id

  // Set status to PENDING_LOCK
  await tx.availabilitySlot.update({
    where: { id: slotId },
    data: {
      status: "PENDING_LOCK",
      bookingId: params.bookingId,
    },
  })

  return slotId
}
```

### Usage in Booking Initiation

```typescript
await prisma.$transaction(async (tx) => {
  // Create the booking first to get an ID
  const booking = await tx.booking.create({ data: { ... } })

  // Then acquire the lock using the booking ID
  await acquireSlotLock(tx, {
    vendorId: params.vendorId,
    date: params.eventDate,
    bookingId: booking.id,
  })

  // Both operations committed atomically
  return booking
})
```

---

## Lock Release — Three Scenarios

### Scenario 1: Payment Confirmed (Lock → BLOCKED)

```typescript
// In the webhook handler, inside the confirmation transaction
await tx.availabilitySlot.upsert({
  where: {
    vendorId_date: {
      vendorId: booking.vendorId,
      date: booking.eventDate,
    },
  },
  update: {
    status: "BLOCKED",
    bookingId: booking.id,
  },
  create: {
    vendorId: booking.vendorId,
    date: booking.eventDate,
    status: "BLOCKED",
    bookingId: booking.id,
  },
})
```

### Scenario 2: Booking Expired (Lock → OPEN)

```typescript
// In the cron job expiry function
await tx.availabilitySlot.updateMany({
  where: {
    vendorId: booking.vendorId,
    date: booking.eventDate,
    status: "PENDING_LOCK",
    bookingId: booking.id,        // Only release THIS booking's lock
  },
  data: {
    status: "OPEN",
    bookingId: null,              // Disassociate from expired booking
  },
})
```

### Scenario 3: Manual Release (Edge Case)

If a vendor manually closes a date that has a PENDING_LOCK, the lock must be respected.
Do NOT allow manual close while a PENDING_LOCK is active:

```typescript
// In the close-date API route
const slot = await prisma.availabilitySlot.findUnique({
  where: { vendorId_date: { vendorId, date } },
  select: { status: true },
})

if (slot?.status === "PENDING_LOCK") {
  return NextResponse.json(
    {
      error: "DATE_PENDING_LOCK",
      message: "This date has an active payment in progress. It will become available again in 15 minutes if payment is not completed.",
    },
    { status: 409 }
  )
}

if (slot?.status === "BLOCKED") {
  return NextResponse.json(
    {
      error: "DATE_BLOCKED",
      message: "This date has a confirmed booking. Cancel the booking first.",
    },
    { status: 409 }
  )
}
```

---

## Availability Slot Queries

### Get available dates for client-facing calendar

```typescript
// lib/availability/get-available-dates.ts
import { prisma } from "@/lib/prisma"
import { startOfDay, addMonths, format } from "date-fns"

export async function getAvailableDates(vendorId: string): Promise<{
  availableDates: string[]
  blockedDates: string[]
}> {
  const from = startOfDay(new Date())
  const to = addMonths(from, 3)

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      vendorId,
      date: { gte: from, lte: to },
      status: { in: ["OPEN", "BLOCKED"] },
    },
    select: { date: true, status: true },
    orderBy: { date: "asc" },
  })

  return {
    availableDates: slots
      .filter((s) => s.status === "OPEN")
      .map((s) => format(s.date, "yyyy-MM-dd")),
    blockedDates: slots
      .filter((s) => s.status === "BLOCKED")
      .map((s) => format(s.date, "yyyy-MM-dd")),
  }
}
```

### Real-time availability check before payment initiation

```typescript
// lib/availability/check-date-available.ts
export async function checkDateAvailable(
  vendorId: string,
  date: Date
): Promise<boolean> {
  const slot = await prisma.availabilitySlot.findUnique({
    where: { vendorId_date: { vendorId, date } },
    select: { status: true },
  })

  return slot?.status === "OPEN"
}
```

---

## Opening and Closing Dates

```typescript
// lib/availability/open-dates.ts
export async function openDates(vendorId: string, dates: Date[]): Promise<void> {
  // Use createMany with skipDuplicates for bulk open
  await prisma.availabilitySlot.createMany({
    data: dates.map((date) => ({
      vendorId,
      date,
      status: "OPEN" as const,
    })),
    skipDuplicates: true,  // If slot exists, leave it unchanged
  })

  // Update CLOSED slots back to OPEN (for dates being reopened)
  await prisma.availabilitySlot.updateMany({
    where: {
      vendorId,
      date: { in: dates },
      status: "CLOSED",
    },
    data: { status: "OPEN" },
  })
}

// lib/availability/close-dates.ts
export async function closeDates(vendorId: string, dates: Date[]): Promise<void> {
  await prisma.availabilitySlot.updateMany({
    where: {
      vendorId,
      date: { in: dates },
      status: "OPEN",  // Only close OPEN slots — cannot close BLOCKED or PENDING_LOCK
    },
    data: { status: "CLOSED" },
  })
}
```

---

## Testing Concurrency

```typescript
// test: concurrent booking attempts
describe("Reservation Lock Manager", () => {
  it("should only allow one booking when two clients attempt the same date simultaneously", async () => {
    // Set up: open date for vendor
    const vendorId = "test-vendor"
    const date = new Date("2026-09-15")
    await prisma.availabilitySlot.create({
      data: { vendorId, date, status: "OPEN" },
    })

    // Simulate concurrent requests
    const [result1, result2] = await Promise.allSettled([
      initiateBooking({ vendorId, date, clientEmail: "client1@test.com", ... }),
      initiateBooking({ vendorId, date, clientEmail: "client2@test.com", ... }),
    ])

    // Exactly one should succeed, one should fail with DATE_UNAVAILABLE
    const successes = [result1, result2].filter((r) => r.status === "fulfilled")
    const failures = [result1, result2].filter((r) => r.status === "rejected")

    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(1)
    expect((failures[0] as PromiseRejectedResult).reason.code).toBe("DATE_UNAVAILABLE")
  })
})
```

---

## Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `DATE_UNAVAILABLE` | 409 | Slot is not OPEN (PENDING_LOCK, BLOCKED, CLOSED, or doesn't exist) |
| `DATE_PENDING_LOCK` | 409 | Slot has an active payment in progress — cannot close manually |
| `DATE_BLOCKED` | 409 | Slot has a confirmed booking — must cancel booking first |

---

## What to Never Do

- Never check availability with a plain `SELECT` and then update in a separate query — this creates a TOCTOU race condition
- Never use `PENDING_LOCK` duration longer than 15 minutes — it blocks the date for other clients
- Never skip the `bookingId` filter when releasing a lock — you could accidentally release another client's lock
- Never allow `status = 'BLOCKED'` to be set outside of a payment confirmation transaction
- Never manually set `status = 'OPEN'` on a BLOCKED slot — require booking cancellation first
