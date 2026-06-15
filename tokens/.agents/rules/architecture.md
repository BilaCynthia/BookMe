---
trigger: always_on
---

# BookMe — Architecture Rules

## Overview

BookMe is a **monolithic Next.js 14 (App Router) application** deployed on Vercel.
It is a payment-confirmed booking platform for Nigerian event vendors.
All architectural decisions must optimise for correctness of booking state, payment reliability, and mobile performance.

---

## Stack Constraints

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | App Router only — no Pages Router patterns |
| Language | TypeScript (strict mode) | No `any`, no `// @ts-ignore` without justification |
| Database | PostgreSQL via Prisma ORM | Neon (serverless) in production |
| Auth | NextAuth.js v5 | JWT sessions, httpOnly cookies |
| Payments | **Flutterwave only** | Never Paystack, Stripe, or any other provider |
| Email | Resend + React Email | No SendGrid, no Nodemailer |
| Media | Cloudinary | For portfolio images and profile photos |
| Styling | Tailwind CSS | Custom design tokens in `tailwind.config.ts` |
| Deployment | Vercel | Serverless functions — respect execution limits |
| Validation | Zod | All API inputs validated with Zod schemas |

---

## Project Structure

```
bookme/
├── app/
│   ├── (public)/               # Public-facing routes (no auth required)
│   │   ├── [slug]/             # Vendor public profile
│   │   │   └── page.tsx
│   │   ├── booking/
│   │   │   └── [reference]/    # Booking confirmation page
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── (auth)/                 # Auth routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── dashboard/              # Protected vendor dashboard
│   │   ├── bookings/
│   │   ├── calendar/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── layout.tsx          # Auth-guard layout
│   ├── onboarding/             # Profile setup wizard
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   ├── vendors/
│   │   ├── services/
│   │   ├── availability/
│   │   ├── bookings/
│   │   ├── payments/
│   │   ├── webhooks/
│   │   │   └── flutterwave/    # Payment webhook endpoint
│   │   └── cron/
│   │       └── expire-bookings/
│   └── layout.tsx
├── components/
│   ├── ui/                     # Primitive UI components (buttons, inputs, etc.)
│   ├── booking/                # Booking flow components
│   ├── dashboard/              # Dashboard-specific components
│   ├── profile/                # Vendor profile components
│   └── shared/                 # Shared across multiple domains
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── auth.ts                 # NextAuth configuration
│   ├── flutterwave/            # Flutterwave SDK wrappers
│   │   ├── initiate-payment.ts
│   │   ├── verify-payment.ts
│   │   └── validate-webhook.ts
│   ├── email/                  # Resend + React Email
│   │   ├── send.ts
│   │   └── templates/
│   ├── cloudinary/             # Cloudinary helpers
│   ├── validations/            # Zod schemas (shared)
│   └── utils/                  # General utility functions
├── emails/                     # React Email templates
│   ├── booking-confirmed-vendor.tsx
│   ├── booking-confirmed-client.tsx
│   └── password-reset.tsx
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── middleware.ts               # Route protection + rate limiting
└── types/
    └── index.ts                # Global TypeScript types
```

---

## Rendering Strategy

| Route | Strategy | Revalidation | Reason |
|---|---|---|---|
| `/[slug]` | SSG + ISR | 60 seconds | Public, high-traffic, cacheable. Must revalidate after profile changes. |
| `/dashboard/*` | SSR | Never cached | Private, personalised. Must always be fresh. |
| `/booking/[reference]` | SSR | Never cached | Must reflect live booking state (polling support). |
| `/onboarding` | SSR | Never cached | Auth-protected, sequential wizard. |
| `/` (landing) | SSG | On deploy | Fully static. |

**Rule:** Never serve stale data on payment-critical pages. When in doubt, use SSR.

---

## Database Rules

- **All monetary values stored in kobo** (smallest NGN unit). 1 NGN = 100 kobo. Never store floats for money.
- **Price snapshot on booking**: Copy `basePriceKobo`, `depositPercent`, `depositAmountKobo` from Service to Booking at creation. Edits to a Service after booking must never affect confirmed bookings.
- **Availability as explicit records**: Each open date is an explicit `AvailabilitySlot` row. All dates are unavailable by default.
- **`expiresAt` on every PENDING booking**: Enables the cron job to expire stale bookings without scanning the whole table.
- **Unique constraint `(vendorId, date)` on `AvailabilitySlot`**: Enforced at the database level. Never rely on application code alone for uniqueness.
- **Never use raw SQL with user-controlled input**: Prisma parameterised queries only.

---

## API Design Rules

- All routes under `/api/`
- Request and response bodies are always JSON
- HTTP semantics:
  - `200` — success (GET, PUT, PATCH)
  - `201` — resource created (POST)
  - `400` — malformed request
  - `401` — unauthenticated
  - `403` — authenticated but not authorised
  - `404` — resource not found
  - `409` — business logic conflict (e.g., date unavailable)
  - `422` — validation error
  - `500` — server error
- **All error responses use this shape:**
  ```json
  {
    "error": "ERROR_CODE",
    "message": "Human-readable description",
    "details": {}
  }
  ```
- **All API inputs validated with Zod** before any database operation
- Authenticated routes must verify session AND resource ownership on every request

---

## Concurrency Rules

- **Booking initiation must use `SELECT FOR UPDATE NOWAIT`** on the `AvailabilitySlot` row.
- The lock is held for 15 minutes (PENDING_LOCK state).
- Only one transaction wins. The second concurrent attempt receives a `409 DATE_UNAVAILABLE` immediately.
- Webhook processing must be **idempotent**: check `WebhookEvent.processed` before acting.
- Booking confirmation (status update + date block + payment record) must happen in a **single Prisma transaction**.

---

## Serverless Constraints (Vercel)

- Default function timeout: 10 seconds. Webhook handler: set to 30 seconds in `vercel.json`.
- **Never import Prisma Client at module level outside of `lib/prisma.ts`**. Use the singleton pattern to prevent connection exhaustion.
- **Connection pooling is mandatory in production**: Use Neon's built-in PgBouncer or Prisma Accelerate. Without it, serverless cold starts will exhaust PostgreSQL connections.
- Background tasks (email sending, logging) must not block the response. Use `Promise.allSettled` for fire-and-forget operations after the primary transaction commits.

---

## Payment Rules

- **Flutterwave is the only payment provider.** No other gateway may be introduced without a full architecture review.
- Payment initiation is server-side only. Never expose `FLUTTERWAVE_SECRET_KEY` to the client.
- Every webhook must be signature-validated using HMAC-SHA256 before processing.
- **Never trust the webhook payload amount alone.** Always re-verify the payment against the Flutterwave API before confirming a booking.
- `tx_ref` format: `bookme-[bookingId]-[timestamp]` — unique, non-guessable.
- All webhook payloads stored in `WebhookEvent` table for audit and debugging.

---

## Environment Variables

All secrets managed via Vercel Environment Variables. Required variables:

```
DATABASE_URL
DIRECT_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
FLUTTERWAVE_PUBLIC_KEY
FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_WEBHOOK_SECRET
FLUTTERWAVE_ENCRYPTION_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL
```

**Rules:**
- Never commit `.env.local` or any file containing secrets
- `NEXT_PUBLIC_*` variables are safe to expose to the browser; all others are server-only
- Validate required env vars at startup with a `validateEnv()` check in `lib/env.ts`

---

## What to Never Do

- Never introduce a second payment provider without a full PRD revision
- Never store card data, CVVs, or full PANs — Flutterwave handles PCI compliance
- Never use `parseInt` or floating-point arithmetic on monetary values
- Never skip Zod validation on an API route input
- Never access `/dashboard/*` without a valid session
- Never return a database error message directly to the client
- Never block a Vercel serverless response waiting for an email to send
- Never use `window.localStorage` for booking state — server is the source of truth