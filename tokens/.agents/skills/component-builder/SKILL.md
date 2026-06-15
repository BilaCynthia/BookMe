# Skill: Component Builder

## Purpose

This skill defines how to build React components for BookMe.
Follow this skill whenever creating UI components — pages, forms, cards, layouts, or interactive elements.

---

## When to Use This Skill

- Building any new React component
- Creating form components (booking flow, profile editor, service manager)
- Building display components (booking cards, calendar, profile page)
- Creating layout components (dashboard shell, public profile wrapper)
- Wrapping Shadcn/UI or Radix primitives into BookMe-specific components

---

## Component Classification

Before building, classify the component:

| Type | Directive | When |
|---|---|---|
| **Server Component** | None (default) | Displays data fetched from the database. No interactivity. |
| **Client Component** | `"use client"` | Needs `useState`, `useEffect`, event handlers, or browser APIs. |
| **Async Server Component** | None + `async` | Fetches its own data directly. |

**Rule:** Default to Server Component. Add `"use client"` only when proven necessary.

---

## File Structure

```
components/
├── ui/                         # Primitive, reusable UI atoms
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   └── Card.tsx
├── booking/                    # Booking flow components
│   ├── BookingCalendar.tsx     # Date picker (client — interactive)
│   ├── BookingForm.tsx         # Client details form (client)
│   ├── BookingSummary.tsx      # Pre-payment summary (server)
│   ├── BookingCard.tsx         # Booking list item (server)
│   └── BookingStatusPoller.tsx # Confirmation page poller (client)
├── dashboard/                  # Dashboard-specific components
│   ├── DashboardShell.tsx      # Layout wrapper (server)
│   ├── BookingsList.tsx        # Filterable list (client)
│   ├── CalendarView.tsx        # Calendar management (client)
│   └── StatsOverview.tsx       # Overview stats (server)
├── profile/                    # Vendor profile components
│   ├── VendorProfilePage.tsx   # Full profile page (server)
│   ├── PortfolioGrid.tsx       # Image grid (server)
│   ├── ServiceCard.tsx         # Single service (server)
│   └── ProfileEditor.tsx       # Edit form (client)
└── shared/                     # Used across domains
    ├── MoneyDisplay.tsx         # Formats kobo → ₦X,XXX
    ├── DateDisplay.tsx          # Formats dates consistently
    ├── StatusBadge.tsx          # Booking status colours
    ├── EmptyState.tsx           # Empty list placeholder
    └── LoadingSpinner.tsx
```

---

## Component Templates

### Server Component (data display)

```typescript
// components/booking/BookingCard.tsx
import { formatNaira } from "@/lib/utils/money"
import { formatDate } from "@/lib/utils/date"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { BookingWithService } from "@/types"

interface BookingCardProps {
  booking: BookingWithService
}

export function BookingCard({ booking }: BookingCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-foreground">{booking.clientName}</p>
          <p className="text-sm text-muted-foreground">{booking.service.name}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{formatDate(booking.eventDate)}</span>
        <span className="font-medium text-foreground">
          {formatNaira(booking.depositAmountKobo)} deposit
        </span>
      </div>

      <p className="text-xs text-muted-foreground font-mono">
        Ref: {booking.reference}
      </p>
    </div>
  )
}
```

### Client Component (interactive)

```typescript
// components/booking/BookingCalendar.tsx
"use client"

import { useState } from "react"
import { isBefore, startOfDay, parseISO } from "date-fns"

interface BookingCalendarProps {
  availableDates: string[]           // ISO date strings "YYYY-MM-DD"
  onDateSelect: (date: string) => void
  selectedDate: string | null
}

export function BookingCalendar({
  availableDates,
  onDateSelect,
  selectedDate,
}: BookingCalendarProps) {
  const availableSet = new Set(availableDates)
  const today = startOfDay(new Date())

  const isAvailable = (date: Date): boolean => {
    if (isBefore(date, today)) return false
    const iso = date.toISOString().split("T")[0]
    return availableSet.has(iso)
  }

  return (
    <div className="booking-calendar" role="grid" aria-label="Select an available date">
      {/* Calendar grid implementation */}
    </div>
  )
}
```

### Async Server Component (self-fetching)

```typescript
// components/dashboard/StatsOverview.tsx
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { formatNaira } from "@/lib/utils/money"

export async function StatsOverview() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [totalConfirmed, upcomingCount] = await Promise.all([
    prisma.booking.count({
      where: { vendorId: session.user.id, status: "CONFIRMED" },
    }),
    prisma.booking.count({
      where: {
        vendorId: session.user.id,
        status: "CONFIRMED",
        eventDate: { gte: new Date() },
      },
    }),
  ])

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Total Bookings" value={totalConfirmed.toString()} />
      <StatCard label="Upcoming This Month" value={upcomingCount.toString()} />
    </div>
  )
}
```

---

## Props & Types

```typescript
// Always define explicit prop interfaces — never use inline object types
// ✅
interface ServiceCardProps {
  service: {
    id: string
    name: string
    description: string
    basePriceKobo: number
    depositPercent: number
    isActive: boolean
  }
  isOwner?: boolean
}

// ❌
function ServiceCard({ service }: { service: any }) { ... }
```

---

## Styling Rules

```typescript
// ✅ Use Tailwind utility classes with design tokens
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium
                   hover:bg-primary/90 transition-colors disabled:opacity-50
                   min-h-[44px] min-w-[44px]">  {/* 44px min touch target */}
  Book Now
</button>

// ✅ Use cn() for conditional classes
import { cn } from "@/lib/utils"

<div className={cn(
  "rounded-lg border p-4 transition-colors",
  isSelected && "border-primary bg-primary/5",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>

// ❌ Never use inline styles for spacing/colour
<div style={{ marginTop: "16px", color: "#0066FF" }}>
```

---

## Accessibility Requirements

Every interactive component must:

```typescript
// ✅ Minimum 44×44px touch targets
className="min-h-[44px] min-w-[44px]"

// ✅ Proper ARIA labels on icon-only buttons
<button aria-label="Remove portfolio image">
  <TrashIcon />
</button>

// ✅ Form fields must have associated labels
<label htmlFor="clientEmail" className="text-sm font-medium">
  Email address
</label>
<input
  id="clientEmail"
  type="email"
  aria-required="true"
  aria-describedby="clientEmail-error"
/>
{error && (
  <p id="clientEmail-error" role="alert" className="text-sm text-destructive">
    {error}
  </p>
)}

// ✅ Keyboard navigation on calendar
onKeyDown={(e) => {
  if (e.key === "Enter" || e.key === " ") handleSelect()
  if (e.key === "ArrowRight") moveToNextDate()
  if (e.key === "ArrowLeft") moveToPrevDate()
}}
```

---

## Money Display Component

```typescript
// components/shared/MoneyDisplay.tsx
import { formatNaira } from "@/lib/utils/money"

interface MoneyDisplayProps {
  kobo: number
  className?: string
  showLabel?: string   // e.g., "Deposit:" or "Base price:"
}

export function MoneyDisplay({ kobo, className, showLabel }: MoneyDisplayProps) {
  return (
    <span className={className}>
      {showLabel && <span className="text-muted-foreground mr-1">{showLabel}</span>}
      <span className="font-semibold">{formatNaira(kobo)}</span>
    </span>
  )
}

// Usage:
<MoneyDisplay kobo={booking.depositAmountKobo} showLabel="Deposit:" />
// Renders: "Deposit: ₦45,000"
```

---

## Status Badge Component

```typescript
// components/shared/StatusBadge.tsx
import type { BookingStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  PENDING:   { label: "Pending",   className: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-green-100  text-green-800"  },
  EXPIRED:   { label: "Expired",   className: "bg-gray-100   text-gray-600"   },
  CANCELLED: { label: "Cancelled", className: "bg-red-100    text-red-800"    },
  COMPLETED: { label: "Completed", className: "bg-blue-100   text-blue-800"   },
}

interface StatusBadgeProps {
  status: BookingStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.className,
      className
    )}>
      {config.label}
    </span>
  )
}
```

---

## Form Validation Pattern

Use React Hook Form + Zod for all forms:

```typescript
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const clientDetailsSchema = z.object({
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientEmail: z.string().email("Please enter a valid email"),
  clientPhone: z.string().min(7, "Please enter a valid phone number"),
  eventDescription: z.string().max(200, "Max 200 characters").optional(),
})

type ClientDetailsFormData = z.infer<typeof clientDetailsSchema>

export function ClientDetailsForm({ onSubmit }: { onSubmit: (data: ClientDetailsFormData) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClientDetailsFormData>({
    resolver: zodResolver(clientDetailsSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-4">
        <div>
          <label htmlFor="clientName">Full name</label>
          <input id="clientName" {...register("clientName")} />
          {errors.clientName && <p role="alert">{errors.clientName.message}</p>}
        </div>
        {/* ... */}
      </div>
    </form>
  )
}
```

---

## What to Never Do

- Never fetch data in a Client Component (`useEffect + fetch`) when a Server Component could pass it as props
- Never use `any` as a prop type
- Never use inline styles for spacing or colour
- Never omit `aria-label` on icon-only interactive elements
- Never render user-generated content as HTML (`dangerouslySetInnerHTML`)
- Never build a form without Zod validation
- Never use `<form>` `action` attribute — use `onSubmit` with React Hook Form
