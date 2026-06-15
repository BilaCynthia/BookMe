# Skill: Domain Model Enforcer

## Purpose

This skill defines the canonical domain model for BookMe — the authoritative names, types, rules, and invariants for every core business concept.
Use this skill whenever you are making a decision that touches business logic, naming, or data modelling.
When in doubt about a term, a field name, a status value, or a business rule, refer here first.

---

## When to Use This Skill

- Naming a new field, model, or variable that represents a business concept
- Writing a business rule that touches booking state, pricing, or availability
- Reviewing code for consistency with the domain model
- Onboarding to the BookMe codebase
- Deciding between two implementation approaches that have different domain implications

---

## Core Domain Concepts

### 1. Vendor

The event service provider. The primary user of BookMe.

| Property | Type | Rules |
|---|---|---|
| `id` | `string` (cuid) | System-generated. Never user-visible. |
| `email` | `string` | Unique. Login credential. May differ from `contactEmail`. |
| `businessName` | `string \| null` | Display name on public profile. |
| `slug` | `string \| null` | URL identifier. Unique. Auto-generated from `businessName`. Customisable once. |
| `category` | `VendorCategory` | Enum. Determines profile icon and filters (Post-MVP). |
| `bio` | `string \| null` | Max 300 chars. Plain text only. |
| `city` | `string \| null` | Free text. City/location the vendor operates from. |
| `contactEmail` | `string \| null` | Email shown on public profile. May differ from login email. |
| `profileCompleted` | `boolean` | Must be `true` before profile goes live. |
| `isActive` | `boolean` | `false` = soft-deleted. Profile returns 404. |
| `tier` | `string` | `"free"` or `"pro"`. Determines commission rate (Post-MVP). |
| `portfolioImages` | `string[]` | Cloudinary URLs. Max 10. |

**Invariants:**
- A vendor cannot have an active public profile (`isActive = true`) unless `profileCompleted = true`.
- A vendor must have at least one active `Service` for their booking page to accept bookings.
- `slug` must be unique across all vendors at the database level.
- A vendor can only read and write their own `Booking`, `Service`, and `AvailabilitySlot` records.

---

### 2. Service

A bookable offering defined by the vendor.

| Property | Type | Rules |
|---|---|---|
| `id` | `string` (cuid) | System-generated. |
| `vendorId` | `string` | FK to Vendor. |
| `name` | `string` | Max 100 chars. Shown on profile and booking flow. |
| `description` | `string` | Max 200 chars. |
| `basePriceKobo` | `int` | In kobo. Min 100,000 (= NGN 1,000). |
| `depositPercent` | `int` | 10–100. |
| `isActive` | `boolean` | Only active services shown on public profile. |

**Invariants:**
- `basePriceKobo` must be ≥ 100,000 (NGN 1,000). Validated server-side.
- `depositPercent` must be 10–100 inclusive. Validated server-side.
- A Service with a confirmed future Booking **cannot be deleted**.
- Editing a Service's price or deposit percent **does not affect existing confirmed Bookings** — they retain their snapshot.
- `depositAmountKobo` is always computed as `Math.floor(basePriceKobo * depositPercent / 100)`.

---

### 3. AvailabilitySlot

Represents the state of a single date on a vendor's calendar.

| Property | Type | Rules |
|---|---|---|
| `id` | `string` (cuid) | System-generated. |
| `vendorId` | `string` | FK to Vendor. |
| `date` | `DateTime @db.Date` | Date only. No time component. |
| `status` | `AvailabilityStatus` | See status definitions below. |
| `bookingId` | `string \| null` | Set when status is `PENDING_LOCK` or `BLOCKED`. |

**AvailabilityStatus definitions:**

| Status | Meaning | Selectable by client? | Editable by vendor? |
|---|---|---|---|
| `OPEN` | Available for booking | ✅ Yes | ✅ Can close |
| `PENDING_LOCK` | Payment in progress — locked for 15 min | ❌ No | ❌ Cannot close while locked |
| `BLOCKED` | Confirmed booking exists | ❌ No | ❌ Must cancel booking first |
| `CLOSED` | Manually closed by vendor | ❌ No | ✅ Can reopen |

**Invariants:**
- One `AvailabilitySlot` per `(vendorId, date)` — enforced by unique constraint.
- All dates are `CLOSED` (effectively absent) by default. Vendors must explicitly open dates.
- Status transitions are strictly controlled:
  - `OPEN` → `PENDING_LOCK`: only via booking initiation (with DB lock)
  - `OPEN` → `CLOSED`: only by vendor manually
  - `PENDING_LOCK` → `BLOCKED`: only via confirmed Flutterwave payment
  - `PENDING_LOCK` → `OPEN`: only when booking expires (cron)
  - `BLOCKED` → `OPEN`: only after booking cancellation (Post-MVP)
  - `CLOSED` → `OPEN`: only by vendor manually
- No other status transitions are valid.

---

### 4. Booking

A reservation request from a client for a specific vendor, service, and date.

| Property | Type | Rules |
|---|---|---|
| `id` | `string` (cuid) | System-generated. Internal use only. |
| `reference` | `string` | Human-readable. Format: `BKM-XXXXXXXX`. Unique. Shown to clients. |
| `vendorId` | `string` | FK to Vendor. |
| `serviceId` | `string` | FK to Service. |
| `clientName` | `string` | Captured at booking. Never auto-updated. |
| `clientEmail` | `string` | Captured at booking. Never auto-updated. |
| `clientPhone` | `string` | Captured at booking. Never auto-updated. |
| `eventDescription` | `string \| null` | Max 200 chars. Optional. |
| `eventDate` | `DateTime @db.Date` | Date only. Must be in the future at booking time. |
| `basePriceKobo` | `int` | **Snapshot** from Service. Immutable after creation. |
| `depositPercent` | `int` | **Snapshot** from Service. Immutable after creation. |
| `depositAmountKobo` | `int` | **Computed snapshot**. Immutable after creation. |
| `status` | `BookingStatus` | See state machine below. |
| `txRef` | `string \| null` | Flutterwave transaction reference. Format: `bookme-[id]-[ts]`. |
| `flutterwaveId` | `string \| null` | Flutterwave's transaction ID. Set on confirmation. |
| `expiresAt` | `DateTime` | `createdAt + 60 minutes`. Used by cron to expire PENDING bookings. |
| `confirmedAt` | `DateTime \| null` | Set when status → CONFIRMED. |
| `paidAt` | `DateTime \| null` | Set when payment is verified. |

**BookingStatus state machine:**

```
PENDING → CONFIRMED   (Flutterwave payment verified via webhook)
PENDING → EXPIRED     (expiresAt passed, cron job runs)
CONFIRMED → COMPLETED (eventDate passed, cron marks complete — Post-MVP)
CONFIRMED → CANCELLED (vendor cancels — Post-MVP)
```

No other transitions are permitted.

**Invariants:**
- A Booking's `basePriceKobo`, `depositPercent`, and `depositAmountKobo` are **immutable** after creation.
- `depositAmountKobo` must equal `Math.floor(basePriceKobo * depositPercent / 100)`.
- A Booking in `CONFIRMED` state **always** has a corresponding `AvailabilitySlot` with `status = BLOCKED`.
- A Booking's `txRef` must be globally unique.
- `clientEmail`, `clientPhone`, and `clientName` are **never** exposed in public API responses.
- Only the vendor who owns the booking may read its full details.
- A client may read their own booking via the `reference` (public, no auth required).

---

### 5. Payment

A record of a successful deposit payment. One-to-one with a confirmed Booking.

| Property | Type | Rules |
|---|---|---|
| `id` | `string` (cuid) | System-generated. |
| `bookingId` | `string` | FK to Booking. Unique (one payment per booking). |
| `amountKobo` | `int` | Must match `booking.depositAmountKobo`. |
| `currency` | `string` | `"NGN"` (MVP). |
| `flutterwaveTxRef` | `string` | The `tx_ref` from Flutterwave. Unique. |
| `flutterwaveId` | `string \| null` | Flutterwave's transaction ID. |
| `flutterwaveStatus` | `string \| null` | Raw status from Flutterwave API. |
| `rawWebhookPayload` | `Json \| null` | Full webhook payload stored for debugging. |
| `paidAt` | `DateTime \| null` | Timestamp of payment. |

**Invariants:**
- A `Payment` record is created **only** when a booking is confirmed.
- `amountKobo` must be ≥ the expected `depositAmountKobo` from the booking.
- Payment records are **immutable** after creation.
- Card data, CVVs, and full PANs are **never** stored. Flutterwave handles all PCI-sensitive data.

---

### 6. WebhookEvent

An audit log entry for every incoming Flutterwave webhook.

| Property | Type | Rules |
|---|---|---|
| `id` | `string` (cuid) | System-generated. |
| `provider` | `string` | `"flutterwave"` (MVP). |
| `eventType` | `string` | e.g., `"charge.completed"`. |
| `txRef` | `string \| null` | The `tx_ref` from the webhook payload. |
| `processed` | `boolean` | `true` when the webhook has been fully handled. |
| `processedAt` | `DateTime \| null` | Timestamp of processing. |
| `error` | `string \| null` | Error message if processing failed. |
| `payload` | `Json` | Full raw webhook payload. |

**Invariants:**
- Every incoming webhook is logged **before** any processing occurs.
- A webhook with `processed = true` is **never processed again** (idempotency).
- `WebhookEvent` records are **never deleted** — they are a permanent audit trail.

---

## Canonical Enums

```typescript
// types/domain.ts

export type VendorCategory =
  | "PHOTOGRAPHER"
  | "VIDEOGRAPHER"
  | "DECORATOR"
  | "CATERER"
  | "MC_DJ"
  | "MAKEUP_ARTIST"
  | "EVENT_PLANNER"
  | "OTHER"

export type AvailabilityStatus =
  | "OPEN"
  | "PENDING_LOCK"
  | "BLOCKED"
  | "CLOSED"

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | "COMPLETED"
```

---

## Canonical Error Codes

All API error responses use these machine-readable codes:

| Code | HTTP | Meaning |
|---|---|---|
| `DATE_UNAVAILABLE` | 409 | Slot is not OPEN at booking initiation time |
| `SERVICE_INACTIVE` | 409 | Service is not active or doesn't belong to vendor |
| `VENDOR_NOT_FOUND` | 404 | Vendor slug/ID not found or `isActive = false` |
| `BOOKING_NOT_FOUND` | 404 | Booking reference/ID not found |
| `PROFILE_INCOMPLETE` | 403 | Vendor's profile wizard not completed |
| `PAYMENT_FAILED` | 502 | Flutterwave payment link generation failed |
| `AMOUNT_MISMATCH` | 200* | Paid amount less than expected deposit |
| `SERVICE_HAS_BOOKINGS` | 409 | Cannot delete service with confirmed future bookings |
| `PORTFOLIO_LIMIT_REACHED` | 409 | Vendor already has 10 portfolio images |
| `VALIDATION_ERROR` | 422 | Zod schema validation failed |
| `UNAUTHORIZED` | 401 | No valid session |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

*`AMOUNT_MISMATCH` returns HTTP 200 to Flutterwave (webhook acknowledged) but the booking is not confirmed.

---

## Terminology Reference

These are the **only** acceptable terms for each concept. Consistency across code, comments, logs, emails, and UI copy is mandatory.

| Correct Term | Never Use | Context |
|---|---|---|
| `vendor` | seller, provider, merchant, user, creator | The event service provider |
| `client` | customer, buyer, user, booker | The person making a booking |
| `booking` | reservation, appointment, order | A confirmed or pending date reservation |
| `deposit` | fee, upfront payment, advance | The partial payment that confirms a booking |
| `remaining balance` | balance, rest, outstanding | What the client owes the vendor directly |
| `service` | package, offering, product, plan | A bookable item a vendor creates |
| `availability` | calendar, schedule, slots | The vendor's open/closed dates |
| `slug` | URL, handle, username, path | The vendor's unique URL identifier |
| `txRef` | transactionId, payRef, paymentRef | Flutterwave transaction reference |
| `kobo` | cents, pence, smallest unit | Monetary storage unit (1 NGN = 100 kobo) |
| `CONFIRMED` | paid, booked, active | Booking status after payment |
| `BLOCKED` | booked, taken, unavailable | AvailabilitySlot status after confirmed booking |
| `OPEN` | available, free, unbooked | AvailabilitySlot status when client can select |
| `PENDING_LOCK` | locked, held, reserved | Temporary lock during active payment |
| `CLOSED` | unavailable, blocked, off | Manually closed by vendor, no booking |
| `webhook` | callback, notification, event | HTTP POST from Flutterwave on payment event |

---

## Business Rules Summary

1. **Payment = Confirmation.** No payment → no blocked date → no confirmed booking. No exceptions.
2. **Price is immutable on booking.** Once a booking is created, its price snapshot never changes.
3. **Dates are closed by default.** Vendors must explicitly open dates. No date is available unless set to `OPEN`.
4. **First payment wins.** Concurrent booking attempts: the one that completes payment first gets the date.
5. **Vendor owns their data.** A vendor can only access bookings, services, and availability belonging to their account.
6. **Deposits are not refundable automatically in MVP.** Refund policy and automation are Post-MVP.
7. **Remaining balance is outside the platform.** BookMe only collects and records the deposit. The remaining balance is the vendor's responsibility.
8. **A confirmed booking always has a blocked date.** These two records must always be in sync. Achieve this with Prisma transactions.
9. **Money is always in kobo internally.** Only convert to naira at display time (UI components) or at payment initiation time (Flutterwave expects naira).
10. **Webhooks are idempotent.** Processing a webhook twice must produce the same result as processing it once.
