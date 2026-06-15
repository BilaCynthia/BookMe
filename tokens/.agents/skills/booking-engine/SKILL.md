# Skill: Booking Engine

## Purpose

This skill covers the complete booking lifecycle in BookMe — from initiation through payment confirmation to expiry.
The booking engine is the most business-critical part of the application.
Every line of code here must prioritise correctness, atomicity, and resilience over convenience.

---

## When to Use This Skill

- Building the booking initiation API (`POST /api/bookings/initiate`)
- Building the payment link generation flow
- Implementing booking status transitions
- Implementing the confirmation page status poller
- Building the booking expiry cron job
- Handling edge cases: concurrent bookings, payment failures, webhook delays
- Any feature that reads or writes `Booking` or `AvailabilitySlot` records

---

## The Core Rule

> **A date is only blocked when a client's payment is confirmed by Flutterwave.**
> No exceptions. No manual overrides. No soft holds that become confirmations.

This rule must be enforced at the database level, not just the application level.

---

## Booking State Machine

```
                    ┌─────────────────────────────────────┐
                    │                                     │
         [Client submits form]              [60 min, no payment]
                    │                                     │
                    ▼                                     │
              ┌──────────┐                               │
              │  PENDING  │────────────────────────────►EXPIRED
              └──────────┘
                    │
         [Flutterwave webhook: successful]
                    │
                    ▼
              ┌───────────┐
              │ CONFIRMED │────► [Event date passes] ──► COMPLETED
              └───────────┘
                    │
         [Vendor cancels — Post-MVP]
                    │
                    ▼
              ┌───────────┐
              │ CANCELLED │
              └───────────┘
```

### Valid state transitions

| From | To | Trigger |
|---|---|---|
| `PENDING` | `CONFIRMED` | Flutterwave webhook received and verified |
| `PENDING` | `EXPIRED` | `expiresAt` passed (cron job) |
| `CONFIRMED` | `COMPLETED` | Event date has passed (cron job) |
| `CONFIRMED` | `CANCELLED` | Vendor cancels (Post-MVP) |

**Rule:** No other transitions are valid. Enforce this in the state update logic.

---

## Booking Initiation — Full Implementation

```typescript
// lib/booking/initiate-booking.ts
import { prisma } from "@/lib/prisma"
import { initiateFlutterwavePayment } from "@/lib/flutterwave/initiate-payment"
import { logger } from "@/lib/logger"
import { BookingError } from "@/lib/errors"
import { generateBookingReference } from "@/lib/booking/generate-reference"

interface InitiateBookingParams {
  vendorId: string
  serviceId: string
  eventDate: Date           // Already parsed from string
  clientName: string
  clientEmail: string
  clientPhone: string
  eventDescription?: string
}

interface InitiateBookingResult {
  bookingId: string
  reference: string
  paymentUrl: string
  depositAmountKobo: number
  expiresAt: Date
}

export async function initiateBooking(
  params: InitiateBookingParams
): Promise<InitiateBookingResult> {
  // ─────────────────────────────────────────────────────────
  // STEP 1: Fetch vendor and service — verify they exist and are active
  // ─────────────────────────────────────────────────────────
  const [vendor, service] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id: params.vendorId, isActive: true },
      select: { id: true, businessName: true, contactEmail: true },
    }),
    prisma.service.findUnique({
      where: { id: params.serviceId, vendorId: params.vendorId, isActive: true },
      select: { id: true, name: true, basePriceKobo: true, depositPercent: true },
    }),
  ])

  if (!vendor) throw new BookingError("VENDOR_NOT_FOUND", "Vendor not found.", 404)
  if (!service) throw new BookingError("SERVICE_INACTIVE", "This service is no longer available.", 409)

  // ─────────────────────────────────────────────────────────
  // STEP 2: Calculate deposit — use integer arithmetic only
  // ─────────────────────────────────────────────────────────
  const depositAmountKobo = Math.floor(
    (service.basePriceKobo * service.depositPercent) / 100
  )
  const depositAmountNaira = depositAmountKobo / 100

  // ─────────────────────────────────────────────────────────
  // STEP 3: Check and lock availability — atomic database operation
  // This is the concurrency-critical section
  // ─────────────────────────────────────────────────────────
  const booking = await prisma.$transaction(async (tx) => {
    // Attempt to acquire pessimistic lock on the availability slot
    // NOWAIT: fail immediately if another transaction holds the lock
    const lockResult = await tx.$queryRaw<{ id: string; status: string }[]>`
      SELECT id, status FROM "availability_slots"
      WHERE "vendorId" = ${params.vendorId}
        AND date = ${params.eventDate}::date
        AND status = 'OPEN'::"AvailabilityStatus"
      FOR UPDATE NOWAIT
    `

    if (lockResult.length === 0) {
      throw new BookingError(
        "DATE_UNAVAILABLE",
        "This date is no longer available. Please select another date.",
        409
      )
    }

    const slotId = lockResult[0].id
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)  // 60 minutes
    const txRef = `bookme-${Date.now()}`  // Will be updated after booking created
    const reference = generateBookingReference()

    // Create the booking record
    const newBooking = await tx.booking.create({
      data: {
        reference,
        vendorId: params.vendorId,
        serviceId: params.serviceId,
        clientName: params.clientName,
        clientEmail: params.clientEmail,
        clientPhone: params.clientPhone,
        eventDescription: params.eventDescription,
        eventDate: params.eventDate,
        // Price snapshot — captured now, never changes
        basePriceKobo: service.basePriceKobo,
        depositPercent: service.depositPercent,
        depositAmountKobo,
        status: "PENDING",
        expiresAt,
        txRef: `bookme-${txRef}-${Date.now()}`,  // Unique tx_ref
      },
    })

    // Update the tx_ref with the booking ID for traceability
    const finalTxRef = `bookme-${newBooking.id}-${Date.now()}`
    await tx.booking.update({
      where: { id: newBooking.id },
      data: { txRef: finalTxRef },
    })

    // Set availability slot to PENDING_LOCK
    await tx.availabilitySlot.update({
      where: { id: slotId },
      data: {
        status: "PENDING_LOCK",
        bookingId: newBooking.id,
      },
    })

    return { ...newBooking, txRef: finalTxRef }
  })

  logger.info("booking.initiated", {
    bookingId: booking.id,
    vendorId: params.vendorId,
    eventDate: params.eventDate,
    depositAmountKobo,
  })

  // ─────────────────────────────────────────────────────────
  // STEP 4: Generate Flutterwave payment URL
  // This is outside the transaction — if it fails, the PENDING booking
  // will be expired by the cron job after 60 minutes
  // ─────────────────────────────────────────────────────────
  const paymentResult = await initiateFlutterwavePayment({
    txRef: booking.txRef!,
    amountNaira: depositAmountNaira,
    clientName: params.clientName,
    clientEmail: params.clientEmail,
    clientPhone: params.clientPhone,
    vendorBusinessName: vendor.businessName ?? "Vendor",
    serviceDescription: service.name,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${booking.reference}/confirmation`,
    meta: { booking_reference: booking.reference },
  })

  if (paymentResult.status === "error") {
    logger.error("booking.payment.link.failed", undefined, {
      bookingId: booking.id,
      message: paymentResult.message,
    })
    throw new BookingError(
      "PAYMENT_FAILED",
      "Unable to initiate payment. Please try again.",
      502
    )
  }

  return {
    bookingId: booking.id,
    reference: booking.reference,
    paymentUrl: paymentResult.paymentUrl,
    depositAmountKobo,
    expiresAt: booking.expiresAt,
  }
}
```

---

## Booking Reference Generator

```typescript
// lib/booking/generate-reference.ts
import { customAlphabet } from "nanoid"

// Uppercase alphanumeric, no confusable characters (0, O, I, 1)
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const nanoid = customAlphabet(alphabet, 8)

export function generateBookingReference(): string {
  return `BKM-${nanoid()}`
  // e.g., "BKM-X7K2M4NP"
}
```

---

## Booking Confirmation (Triggered by Webhook)

```typescript
// lib/booking/confirm-booking.ts
// Called by the webhook handler after payment is verified

import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function confirmBooking(
  txRef: string,
  flutterwaveId: string,
  webhookEventId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Find pending booking
    const booking = await tx.booking.findUnique({
      where: { txRef },
      include: {
        vendor: { select: { id: true, businessName: true, contactEmail: true } },
        service: { select: { name: true } },
      },
    })

    if (!booking) throw new Error(`Booking not found for txRef: ${txRef}`)
    if (booking.status === "CONFIRMED") {
      // Idempotent — already confirmed
      return
    }
    if (booking.status !== "PENDING") {
      throw new Error(`Booking ${booking.id} is in unexpected state: ${booking.status}`)
    }

    // Update booking to CONFIRMED
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        paidAt: new Date(),
        flutterwaveId,
      },
    })

    // Block the availability slot
    await tx.availabilitySlot.upsert({
      where: {
        vendorId_date: {
          vendorId: booking.vendorId,
          date: booking.eventDate,
        },
      },
      update: { status: "BLOCKED", bookingId: booking.id },
      create: {
        vendorId: booking.vendorId,
        date: booking.eventDate,
        status: "BLOCKED",
        bookingId: booking.id,
      },
    })

    // Create payment record
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        amountKobo: booking.depositAmountKobo,
        currency: "NGN",
        flutterwaveTxRef: txRef,
        flutterwaveId,
        flutterwaveStatus: "successful",
        paidAt: new Date(),
      },
    })

    // Mark webhook as processed
    await tx.webhookEvent.update({
      where: { id: webhookEventId },
      data: { processed: true, processedAt: new Date() },
    })
  })

  logger.info("booking.confirmed", { txRef, flutterwaveId })
}
```

---

## Booking Expiry (Cron Job)

```typescript
// lib/booking/expire-bookings.ts
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function expireStaleBookings(): Promise<number> {
  const now = new Date()

  const staleBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    select: { id: true, vendorId: true, eventDate: true },
  })

  if (staleBookings.length === 0) return 0

  await prisma.$transaction(async (tx) => {
    // Expire all stale PENDING bookings
    await tx.booking.updateMany({
      where: { id: { in: staleBookings.map((b) => b.id) } },
      data: { status: "EXPIRED" },
    })

    // Release PENDING_LOCK on availability slots
    for (const booking of staleBookings) {
      await tx.availabilitySlot.updateMany({
        where: {
          vendorId: booking.vendorId,
          date: booking.eventDate,
          status: "PENDING_LOCK",
          bookingId: booking.id,
        },
        data: { status: "OPEN", bookingId: null },
      })
    }
  })

  logger.info("bookings.expired", { count: staleBookings.length })
  return staleBookings.length
}
```

---

## Status Polling Endpoint

```typescript
// lib/booking/get-booking-status.ts
// Used by the confirmation page to poll for booking status after payment

import { prisma } from "@/lib/prisma"

export interface BookingStatusResult {
  reference: string
  status: string
  confirmedAt: string | null
  vendorName: string
  serviceName: string
  eventDate: string
  depositAmountKobo: number
}

export async function getBookingStatus(
  reference: string
): Promise<BookingStatusResult | null> {
  const booking = await prisma.booking.findUnique({
    where: { reference },
    select: {
      reference: true,
      status: true,
      confirmedAt: true,
      eventDate: true,
      depositAmountKobo: true,
      vendor: { select: { businessName: true } },
      service: { select: { name: true } },
    },
  })

  if (!booking) return null

  return {
    reference: booking.reference,
    status: booking.status,
    confirmedAt: booking.confirmedAt?.toISOString() ?? null,
    vendorName: booking.vendor.businessName ?? "Vendor",
    serviceName: booking.service.name,
    eventDate: booking.eventDate.toISOString().split("T")[0],
    depositAmountKobo: booking.depositAmountKobo,
  }
}
```

---

## Edge Cases & Handling

| Scenario | Handling |
|---|---|
| Two clients book same date simultaneously | `SELECT FOR UPDATE NOWAIT` — second transaction fails immediately with `DATE_UNAVAILABLE` |
| Client leaves mid-flow without paying | Booking expires after 60 minutes. Cron releases the PENDING_LOCK. Date becomes OPEN again. |
| Webhook arrives before booking record exists | Return 500 from webhook handler. Flutterwave retries. |
| Webhook arrives but booking is already CONFIRMED | Idempotency check returns 200 immediately. No action. |
| Payment succeeds but webhook is delayed | Confirmation page polls `/api/bookings/[ref]/status` every 5s for up to 5 minutes. Shows "verifying" state. |
| Flutterwave sends duplicate webhook | `WebhookEvent.processed = true` check prevents double-processing. |
| Vendor edits service price after booking confirmed | Booking retains the snapshot price. New clients see new price. |
| Client pays wrong amount | `verifyFlutterwavePayment` checks amount. If less than expected, booking is NOT confirmed. Flagged for manual review. |

---

## What to Never Do

- Never confirm a booking without first verifying via the Flutterwave API
- Never update `AvailabilitySlot.status` to `BLOCKED` outside of a Prisma transaction that also updates `Booking.status`
- Never skip the `SELECT FOR UPDATE NOWAIT` when checking availability — it's the race condition guard
- Never expose the `clientPhone` or `clientEmail` in any public-facing API endpoint
- Never calculate deposit as a float — always use `Math.floor(basePriceKobo * percent / 100)`
- Never allow a booking reference to be guessable — use nanoid