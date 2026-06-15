# Skill: DB Migration Runner

## Purpose

This skill defines how to create, run, and manage Prisma database migrations in BookMe.
Follow this skill any time the database schema changes — adding tables, columns, indexes, constraints, or enums.

---

## When to Use This Skill

- Adding a new model to `prisma/schema.prisma`
- Adding a column to an existing model
- Adding or modifying indexes
- Changing an enum
- Renaming a field (destructive — requires careful handling)
- Seeding the database with test data
- Troubleshooting migration drift between environments

---

## Technology

- **ORM:** Prisma
- **Database:** PostgreSQL (Neon in production)
- **Environment branching:** Neon database branches for preview environments

---

## Database Connection Setup

```prisma
// prisma/schema.prisma — datasource block
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled connection (PgBouncer) — for app
  directUrl = env("DIRECT_URL")        // Direct connection — for migrations only
}
```

**Why two URLs?**
- `DATABASE_URL` goes through PgBouncer (connection pooling) — used by the app
- `DIRECT_URL` bypasses pooling — required by `prisma migrate` which needs persistent connections

---

## Migration Commands

```bash
# ─── Development ───────────────────────────────────────────────────

# Create a new migration after editing schema.prisma
npx prisma migrate dev --name <descriptive-name>
# Examples:
# npx prisma migrate dev --name add-flutterwave-id-to-booking
# npx prisma migrate dev --name add-portfolio-images-table
# npx prisma migrate dev --name add-tier-column-to-vendor

# Apply pending migrations (skips schema change detection)
npx prisma migrate dev

# Reset database (DESTRUCTIVE — dev only)
npx prisma migrate reset

# ─── Production / Staging ──────────────────────────────────────────

# Apply pending migrations in production (no interactive prompt)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# ─── Schema Utilities ──────────────────────────────────────────────

# Regenerate Prisma Client after schema change
npx prisma generate

# Push schema to database without a migration file (ONLY for prototyping)
# NEVER use in production
npx prisma db push

# ─── Introspection ─────────────────────────────────────────────────

# Pull schema from existing database
npx prisma db pull
```

---

## Migration Naming Convention

Use descriptive, action-oriented names in `snake_case`:

```
✅ add_webhook_event_table
✅ add_flutterwave_id_to_booking
✅ add_tier_column_to_vendor
✅ add_index_on_booking_expires_at
✅ rename_vendor_to_user_table
✅ make_profile_photo_optional

❌ update_schema
❌ migration_1
❌ fix
❌ changes
```

---

## Safe Migration Patterns

### Adding a new table

```prisma
// 1. Add model to schema.prisma
model WebhookEvent {
  id          String   @id @default(cuid())
  provider    String   @default("flutterwave")
  eventType   String
  payload     Json
  txRef       String?
  processed   Boolean  @default(false)
  processedAt DateTime?
  error       String?
  createdAt   DateTime @default(now())

  @@index([txRef])
  @@map("webhook_events")
}

// 2. Run migration
// npx prisma migrate dev --name add_webhook_event_table
```

### Adding a nullable column (safe — no data migration needed)

```prisma
model Booking {
  // existing fields...
  flutterwaveId   String?    // ✅ Nullable — existing rows get NULL automatically
}
// npx prisma migrate dev --name add_flutterwave_id_to_booking
```

### Adding a non-nullable column (requires default or data migration)

```prisma
// ✅ Option A: Add with a default value
model Vendor {
  tier  String  @default("free")    // Existing rows get "free"
}

// ✅ Option B: Add as nullable first, backfill, then make required
// Step 1: Add as nullable
model Vendor {
  tier  String?
}
// npx prisma migrate dev --name add_tier_nullable_to_vendor

// Step 2: Backfill existing rows
// Run in a script or Prisma Studio:
// UPDATE vendors SET tier = 'free' WHERE tier IS NULL;

// Step 3: Make non-nullable
model Vendor {
  tier  String  @default("free")
}
// npx prisma migrate dev --name make_tier_required_with_default
```

### Adding an index

```prisma
model Booking {
  // ...
  @@index([vendorId, status])           // Composite index
  @@index([expiresAt, status])          // For cron expiry query
}
// npx prisma migrate dev --name add_composite_index_booking_vendor_status
```

### Adding a unique constraint

```prisma
model AvailabilitySlot {
  // ...
  @@unique([vendorId, date])            // One record per vendor per date
}
// npx prisma migrate dev --name add_unique_constraint_availability_vendor_date
```

---

## Destructive Operations (Handle with Care)

### Renaming a column

Prisma does not auto-detect renames — it will DROP the old column and ADD a new one, losing data.

```bash
# Safe approach:
# 1. Add new column (nullable)
# 2. Migrate data: UPDATE table SET new_col = old_col
# 3. Drop old column
# Do NOT rely on prisma migrate for renaming — write raw SQL steps

# In migration file, you can add custom SQL:
-- migration.sql
ALTER TABLE "vendors" RENAME COLUMN "name" TO "businessName";
```

### Dropping a table or column

```bash
# Always take a database backup before dropping
# Ensure no application code references the dropped field before running migration
# Use --create-only to review the migration SQL before applying:
npx prisma migrate dev --name drop_legacy_table --create-only
# Then review prisma/migrations/<timestamp>_drop_legacy_table/migration.sql
# Then apply: npx prisma migrate dev
```

---

## Production Deployment

Migrations run automatically during Vercel deployment via the build command:

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

**Or in vercel.json:**
```json
{
  "buildCommand": "prisma migrate deploy && next build"
}
```

**Rules for production migrations:**
- Always test the migration on the staging database first
- All migrations must be backwards-compatible with the currently deployed code
  (i.e., new nullable columns are safe; dropping used columns is not)
- Never run `prisma migrate reset` in production — it drops all data
- Never run `prisma db push` in production — it skips migration history

---

## Seed Data (Development Only)

```typescript
// prisma/seed.ts
import { prisma } from "../lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  // Create a test vendor
  const vendor = await prisma.vendor.upsert({
    where: { email: "test@bookme.app" },
    update: {},
    create: {
      email: "test@bookme.app",
      passwordHash: await bcrypt.hash("password123", 12),
      businessName: "Test Photography",
      slug: "test-photography",
      category: "PHOTOGRAPHER",
      bio: "A test vendor for development.",
      city: "Lagos",
      contactEmail: "test@bookme.app",
      profileCompleted: true,
      services: {
        create: [
          {
            name: "Wedding Photography",
            description: "Full day wedding coverage",
            basePriceKobo: 30000000,  // NGN 300,000
            depositPercent: 30,
            isActive: true,
          },
        ],
      },
    },
  })

  console.log(`Seeded vendor: ${vendor.businessName}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

```bash
# Run seed
npx prisma db seed
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Migration file already exists" | You edited schema.prisma without running migrate. Run `npx prisma migrate dev`. |
| "Drift detected" | Your DB has changes not reflected in migrations. Run `npx prisma migrate resolve`. |
| "Can't reach database" | Check `DATABASE_URL`. Ensure Neon/Supabase is running. |
| "Connection pool exhausted" | Use `DIRECT_URL` for migrations. Check PgBouncer config. |
| Migration applied in dev but not staging | Run `npx prisma migrate status` on staging. Apply with `prisma migrate deploy`. |
| Prisma Client out of date | Run `npx prisma generate` after any schema change. |

---

## Checklist Before Running a Migration

- [ ] Migration name is descriptive (`add_flutterwave_id_to_booking`, not `update`)
- [ ] New non-nullable columns have `@default(...)` or existing rows will be backfilled
- [ ] Reviewed the generated SQL in `prisma/migrations/*/migration.sql`
- [ ] Tested on local database first (`prisma migrate dev`)
- [ ] Tested on staging database before production (`prisma migrate deploy`)
- [ ] Application code is compatible with both old and new schema during deployment window
- [ ] Prisma Client regenerated (`prisma generate`)
