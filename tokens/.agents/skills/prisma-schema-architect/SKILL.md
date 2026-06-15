# Skill: Prisma Schema Architect

## Purpose

This skill defines how to design, write, and evolve the Prisma schema for BookMe.
Use it whenever adding models, modifying relationships, defining enums, or designing indexes.

---

## When to Use This Skill

- Adding a new model to `prisma/schema.prisma`
- Designing relationships between models
- Adding or refining indexes for query performance
- Defining new enums
- Evolving existing models (adding fields, changing types)
- Reviewing schema decisions for correctness and performance

---

## Canonical Schema

The following is the authoritative BookMe schema. Always work from this as the base.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────

enum VendorCategory {
  PHOTOGRAPHER
  VIDEOGRAPHER
  DECORATOR
  CATERER
  MC_DJ
  MAKEUP_ARTIST
  EVENT_PLANNER
  OTHER
}

enum AvailabilityStatus {
  OPEN          // Available for booking
  PENDING_LOCK  // Locked while a client's payment is in progress (15 min)
  BLOCKED       // Confirmed booking exists on this date
  CLOSED        // Manually closed by vendor (no booking)
}

enum BookingStatus {
  PENDING     // Booking initiated, payment not yet received
  CONFIRMED   // Payment verified. Date blocked.
  EXPIRED     // PENDING for > 60 minutes with no payment
  CANCELLED   // Cancelled post-confirmation (Post-MVP)
  COMPLETED   // Event date has passed, not cancelled
}

// ─────────────────────────────────────────────────────────
// AUTH TABLES (NextAuth.js v5)
// ─────────────────────────────────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user              Vendor  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user         Vendor   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ─────────────────────────────────────────────────────────
// VENDOR (core user entity)
// ─────────────────────────────────────────────────────────

model Vendor {
  id               String         @id @default(cuid())

  // Auth fields
  email            String         @unique
  emailVerified    DateTime?
  passwordHash     String?

  // Profile
  businessName     String?
  slug             String?        @unique
  category         VendorCategory?
  bio              String?        @db.VarChar(300)
  city             String?
  contactEmail     String?
  profilePhoto     String?        // Cloudinary URL
  instagramHandle  String?
  whatsappNumber   String?
  portfolioImages  String[]       // Array of Cloudinary URLs (max 10)

  // Account state
  profileCompleted Boolean        @default(false)
  isActive         Boolean        @default(true)

  // Monetisation (Post-MVP)
  tier             String         @default("free")

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  // NextAuth relations
  accounts         Account[]
  sessions         Session[]

  // Business relations
  services         Service[]
  availabilitySlots AvailabilitySlot[]
  bookings         Booking[]

  @@index([slug])
  @@index([category])
  @@index([isActive])
  @@map("vendors")
}

// ─────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────

model Service {
  id               String    @id @default(cuid())
  vendorId         String

  name             String    @db.VarChar(100)
  description      String    @db.VarChar(200)
  basePriceKobo    Int       // All money stored in kobo (NGN smallest unit)
  depositPercent   Int       // 10–100
  isActive         Boolean   @default(true)

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  vendor           Vendor    @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  bookings         Booking[]

  @@index([vendorId, isActive])
  @@map("services")
}

// ─────────────────────────────────────────────────────────
// AVAILABILITY SLOT
// ─────────────────────────────────────────────────────────

model AvailabilitySlot {
  id        String             @id @default(cuid())
  vendorId  String
  date      DateTime           @db.Date  // Date only — no time component
  status    AvailabilityStatus @default(OPEN)
  bookingId String?            @unique   // FK to Booking (nullable — only set when BLOCKED)

  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt

  vendor    Vendor             @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  booking   Booking?           @relation(fields: [bookingId], references: [id])

  @@unique([vendorId, date])   // One status record per vendor per date — enforced at DB level
  @@index([vendorId, status])
  @@index([date])
  @@map("availability_slots")
}

// ─────────────────────────────────────────────────────────
// BOOKING
// ─────────────────────────────────────────────────────────

model Booking {
  id               String        @id @default(cuid())
  reference        String        @unique  // Human-readable: "BKM-2026-XXXX"

  vendorId         String
  serviceId        String

  // Client information
  clientName       String
  clientEmail      String
  clientPhone      String
  eventDescription String?       @db.VarChar(200)

  // Event details
  eventDate        DateTime      @db.Date

  // Price snapshot — captured at booking time, never changes
  basePriceKobo    Int
  depositPercent   Int
  depositAmountKobo Int          // = floor(basePriceKobo * depositPercent / 100)

  // Status
  status           BookingStatus @default(PENDING)

  // Flutterwave references
  txRef            String?       @unique   // "bookme-[id]-[timestamp]"
  flutterwaveId    String?                 // Flutterwave's transaction ID

  // Timing
  expiresAt        DateTime                // PENDING expires after 60 minutes
  confirmedAt      DateTime?
  paidAt           DateTime?

  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  vendor           Vendor        @relation(fields: [vendorId], references: [id])
  service          Service       @relation(fields: [serviceId], references: [id])
  payment          Payment?
  availabilitySlot AvailabilitySlot?

  @@index([vendorId, status])
  @@index([clientEmail])
  @@index([eventDate])
  @@index([status, expiresAt])   // Critical for cron expiry job
  @@index([txRef])
  @@map("bookings")
}

// ─────────────────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────────────────

model Payment {
  id                  String    @id @default(cuid())
  bookingId           String    @unique

  amountKobo          Int
  currency            String    @default("NGN")

  flutterwaveTxRef    String    @unique
  flutterwaveId       String?
  flutterwaveStatus   String?

  rawWebhookPayload   Json?     // Full webhook stored for debugging

  paidAt              DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  booking             Booking   @relation(fields: [bookingId], references: [id])

  @@map("payments")
}

// ─────────────────────────────────────────────────────────
// WEBHOOK EVENT (audit log + idempotency)
// ─────────────────────────────────────────────────────────

model WebhookEvent {
  id           String    @id @default(cuid())
  provider     String    @default("flutterwave")
  eventType    String
  txRef        String?
  processed    Boolean   @default(false)
  processedAt  DateTime?
  error        String?
  payload      Json

  createdAt    DateTime  @default(now())

  @@index([txRef, processed])
  @@map("webhook_events")
}
```

---

## Schema Design Principles

### 1. Money in Kobo Always

```prisma
// ✅ All monetary fields use kobo (integer)
basePriceKobo    Int
depositAmountKobo Int

// ❌ Never floating point money
price   Float
amount  Decimal  // Avoid unless precision beyond kobo is genuinely needed
```

### 2. Dates vs DateTimes

```prisma
// Use @db.Date for date-only fields (no time component)
eventDate   DateTime  @db.Date     // ✅ Stored as DATE in PostgreSQL
createdAt   DateTime  @default(now())  // ✅ Full timestamp with timezone
```

### 3. Unique Constraints at Database Level

```prisma
// ✅ Critical uniqueness must be enforced by the database, not just application code
@@unique([vendorId, date])   // One availability record per vendor per date
@@unique([provider, providerAccountId])  // One OAuth account per provider per user
txRef   String?  @unique     // One booking per Flutterwave transaction
```

### 4. Indexes on Query Patterns

Add indexes for every field used in `WHERE`, `ORDER BY`, or JOIN conditions that will be run frequently:

```prisma
@@index([vendorId, status])      // Dashboard booking list filtered by status
@@index([status, expiresAt])     // Cron job: find expired pending bookings
@@index([txRef])                 // Webhook handler: look up booking by txRef
@@index([slug])                  // Public profile page lookup
@@index([clientEmail])           // Future: client booking history
```

### 5. Price Snapshot Pattern

When a booking is created, copy the current pricing from Service to Booking:

```typescript
// In booking initiation logic:
const depositAmountKobo = Math.floor(
  (service.basePriceKobo * service.depositPercent) / 100
)

await prisma.booking.create({
  data: {
    // ... other fields
    basePriceKobo: service.basePriceKobo,    // Snapshot — never reference service again for pricing
    depositPercent: service.depositPercent,
    depositAmountKobo,
  }
})
```

### 6. Soft Deletes for Vendors

```prisma
model Vendor {
  isActive  Boolean  @default(true)
  // No deletedAt — just flip isActive = false
}

// Public profile page:
// if (!vendor.isActive) notFound()
```

### 7. Explicit Table Names

Always use `@@map()` to control the actual database table name:

```prisma
model Vendor {
  // ...
  @@map("vendors")    // Table is "vendors" not "Vendor"
}
```

---

## Relationship Rules

| Relationship | Pattern | Cascade |
|---|---|---|
| Vendor → Services | One-to-many | `onDelete: Cascade` (vendor deleted → services deleted) |
| Vendor → AvailabilitySlots | One-to-many | `onDelete: Cascade` |
| Vendor → Bookings | One-to-many | No cascade (keep booking records) |
| Service → Bookings | One-to-many | No cascade (keep booking records) |
| Booking → Payment | One-to-one | `onDelete: Cascade` |
| Booking → AvailabilitySlot | One-to-one (optional) | No cascade |
| Vendor → Accounts (NextAuth) | One-to-many | `onDelete: Cascade` |

---

## Adding Fields — Decision Guide

| New field type | Approach |
|---|---|
| Optional profile info | Add as `String?` (nullable) — safe migration |
| Required business data | Add with `@default(...)` or migrate existing rows first |
| Foreign key | Add as nullable first, then populate, then make required |
| Array of strings | `String[]` — PostgreSQL native array, no join table needed |
| JSON blob | `Json` — for unstructured data like webhook payloads |
| Enum | Define in schema + `prisma migrate dev` — adds CHECK constraint |
| Monetary amount | Always `Int` (kobo) — never `Float` or `Decimal` |

---

## Common Anti-Patterns to Avoid

```prisma
// ❌ Never store money as float
basePrice  Float

// ❌ Never omit @map — table names should be snake_case plural
model Booking { ... }  // Creates table "Booking" — use @@map("bookings")

// ❌ Never store sensitive data without considering access control
cardNumber  String  // NEVER — PCI violation

// ❌ Never use @db.Text for short strings
bio  String  @db.Text  // Use @db.VarChar(300) for known max length

// ❌ Never skip indexes on foreign keys in large tables
model Booking {
  vendorId  String  // Missing: @@index([vendorId]) — full table scan on lookups
}

// ❌ Never create a many-to-many for a simple scenario
// A vendor has services, a service belongs to one vendor — use one-to-many
```
