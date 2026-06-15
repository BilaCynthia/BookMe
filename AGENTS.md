# BookMe — Agent Master Context

> This is the primary context file for all AI-assisted development on BookMe.
> Read this file before any other `.agents/rules/` file.
> Every decision made in this codebase must align with the product vision, constraints, and principles documented here.

---

## What is BookMe?

BookMe is a **payment-confirmed booking web application** for event vendors — photographers, decorators, caterers, MCs, makeup artists, and event planners.

It gives every vendor a shareable booking page where clients can view services, check availability, and pay a deposit to lock in a date.

**The non-negotiable core mechanic:**
> A date is only blocked when a client pays a deposit. No payment = no confirmed booking. No exceptions.

This single rule is the entire product. Every feature, every API route, every UI decision exists to support or protect this mechanic.

---

## The Problem BookMe Solves

Event vendors in Nigeria run their businesses through Instagram and WhatsApp. The result is:

- Double-bookings from holding dates informally
- No-shows from clients who never paid
- Lost income from uncommitted holds
- No paper trail when disputes arise
- Endless manual admin: chasing deposits, confirming dates, sending reminders

BookMe replaces the entire DM-to-deposit workflow with one shareable link and one atomic flow.

---

## Users

### Vendor
An event service provider. Creates a BookMe profile with services, pricing, and availability. Shares their unique BookMe link. Gets notified and paid when a booking is confirmed.

- **Auth required:** Yes (NextAuth.js — email/password or Google OAuth)
- **Dashboard:** Yes (bookings, calendar, profile, settings)
- **Examples:** Sade the photographer, Emeka the decorator, Chisom the caterer

### Client
A person booking a vendor for an event.

- **Auth required:** No — guest checkout by default. Optional account creation after payment.
- **No dashboard:** Clients receive confirmation by email only (MVP)
- **Examples:** Someone planning a wedding, birthday, or corporate event

---

## Core User Flows

### Vendor Onboarding
```
Sign Up → Email Verification → Profile Setup Wizard
  → Step 1: Basic info (name, category, location)
  → Step 2: Add first service (name, price, deposit %)
  → Step 3: Open first available dates
  → Step 4: Preview profile
  → Dashboard (live)
```

### Client Booking Flow
```
Visit /[vendor-slug]
  → View profile, portfolio, services, available dates
  → Select service + date
  → View booking summary (service, date, base price, deposit due)
  → Enter details (name, email, phone, optional event description)
  → Optional: create account or continue as guest
  → Flutterwave checkout → pay deposit
  → Payment confirmed → date auto-blocked
  → Confirmation page (/booking/[reference])
  → Confirmation email sent to vendor and client
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack. SSG for public pages, SSR for dashboard |
| Language | TypeScript | Strict mode. All files `.ts` or `.tsx` |
| Database | PostgreSQL | Via Neon (serverless, connection pooling) |
| ORM | Prisma | Type-safe queries. Single source of truth for schema |
| Auth | NextAuth.js | JWT sessions. Email/password + Google OAuth |
| Payments | Flutterwave | Card, bank transfer, USSD. NGN (MVP) |
| Email | Resend | Transactional emails only (MVP) |
| Styling | Tailwind CSS | Custom design tokens via `tailwind.config.ts`. No inline styles. |
| Deployment | Vercel | Serverless functions, Cron jobs, Image Optimisation, ISR |

---

## Project Structure

```
bookme/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Landing page
│   │   ├── [vendor-slug]/
│   │   │   └── page.tsx              # Public vendor profile
│   │   └── booking/
│   │       └── [reference]/
│   │           └── page.tsx          # Booking confirmation page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx                # Protected layout
│   │   ├── page.tsx                  # Overview
│   │   ├── bookings/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── profile/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── vendors/
│       ├── services/
│       ├── availability/
│       ├── bookings/
│       ├── payments/
│       ├── webhooks/
│       │   └── flutterwave/route.ts
│       └── cron/
│           └── expire-bookings/route.ts
├── components/
│   ├── ui/                           # Base UI components (buttons, inputs, cards)
│   ├── vendor/                       # Vendor-specific components
│   ├── booking/                      # Booking flow components
│   └── dashboard/                    # Dashboard components
├── lib/
│   ├── db.ts                         # Prisma client singleton
│   ├── auth.ts                       # NextAuth config
│   ├── flutterwave.ts                # Flutterwave helpers
│   ├── resend.ts                     # Email helpers
│   └── utils.ts                      # Shared utilities
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── types/
│   └── index.ts                      # Shared TypeScript types
├── .agents/
│   └── rules/                        # All agent context files live here
├── AGENT.md                          # ← You are here
└── .env.local
```

---

## Design System

### Colour Palette — Deep Forest & Warm Sand

All colours are defined as HSL values in `tailwind.config.ts` and must be referenced by token name only. Never hardcode hex or HSL values in components.

| Token | HSL | Usage |
|---|---|---|
| `primary` | 158, 37%, 17% | Nav, hero bg, key UI |
| `primary-hover` | 158, 30%, 36% | Hover/active states |
| `primary-tint` | 158, 25%, 88% | Badges, light fills |
| `primary-foreground` | 158, 40%, 92% | Text on primary bg |
| `secondary` | 34, 72%, 69% | CTA buttons, accents |
| `secondary-hover` | 34, 65%, 56% | Button hover |
| `secondary-tint` | 34, 70%, 93% | Warm highlights |
| `secondary-foreground` | 34, 50%, 18% | Text on amber bg |
| `tertiary` | 158, 20%, 37% | Secondary actions |
| `tertiary-hover` | 158, 18%, 50% | Hover state |
| `tertiary-tint` | 158, 20%, 91% | Subtle tag fills |
| `tertiary-foreground` | 158, 25%, 95% | Text on sage bg |
| `background` | 36, 20%, 96% | Page background (sand) |
| `surface` | 36, 15%, 99% | Cards, modals |
| `border` | 36, 10%, 88% | Dividers, outlines |
| `foreground` | 36, 8%, 14% | Body text |
| `muted` | 36, 12%, 92% | Input fills, table rows |
| `muted-foreground` | 36, 8%, 60% | Placeholder, captions |
| `subtle` | 36, 8%, 38% | Secondary body text |
| `subtle-border` | 36, 10%, 82% | Subtle dividers |

### Typography
- **Headings:** Inter
- **Body:** Inter
- **Mono:** Inter

---

## Critical Rules for the Agent

### Always
- Use TypeScript. Never use `any` — use proper types or `unknown`.
- Validate all API inputs with **Zod** before touching the database.
- Use the **Prisma client singleton** from `lib/db.ts` — never instantiate a new PrismaClient directly.
- Verify vendor ownership on every authenticated API route — a vendor can only read and write their own data.
- Store all prices in **kobo** (smallest NGN unit) in the database. Divide by 100 for display.
- Reference design tokens by name in Tailwind classes. Never hardcode colour values.
- Keep the booking confirmation flow **atomic** — date block and booking status update must happen in a single Prisma transaction.

### Never
- Never store card data or raw payment details — Flutterwave handles all of this.
- Never expose client personal data (name, email, phone) on public-facing API routes.
- Never skip webhook signature verification on `/api/webhooks/flutterwave`.
- Never allow a date to be blocked without a corresponding confirmed payment.
- Never use `getSession()` on the server — always use `getServerSession(authOptions)`.
- Never commit `.env.local` or any file containing secrets.
- Never write raw SQL — use Prisma queries only.

### Payment & Booking Logic
- The booking confirmation flow is: **payment webhook → verify signature → verify amount → update booking to CONFIRMED → block date → send emails** — in that order, in a single transaction where possible.
- Webhook handlers must be **idempotent** — processing the same webhook twice must not create a double-booking or double-email.
- Pending bookings expire after **60 minutes**. The date lock (`PENDING_LOCK`) expires after **15 minutes**.
- Always re-check date availability at payment initiation — never trust the state from when the page was loaded.

---

## Environment Variables

```bash
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_SECRET_HASH=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Context Files Index

All detailed context lives in `.agents/rules/`. Read the relevant file before working on that domain.

| File | Domain |
|---|---|
| `project.md` | Full product overview and strategy |
| `tech-stack.md` | Stack rationale and configuration |
| `database-schema.md` | Full Prisma schema with annotations |
| `api-routes.md` | All API routes, request/response shapes |
| `auth.md` | NextAuth setup, session handling, route protection |
| `payments.md` | Flutterwave integration, webhook processing, idempotency |
| `booking-flow.md` | Full booking flow, states, edge cases |
| `availability.md` | Calendar logic, concurrency, auto-blocking |
| `design-tokens.md` | Full HSL token set, typography, spacing |
| `email-templates.md` | All transactional emails — triggers, content, CTAs |
| `vendor-dashboard.md` | Dashboard tabs, data, filters |
| `error-handling.md` | Error formats, status codes, failure scenarios |
| `file-structure.md` | Full folder and file structure |
| `environment-variables.md` | All env vars by service and environment |
| `security.md` | Auth security, input validation, API protection rules |

---

*BookMe AGENT.md · v1.0 · Read this first, always.*