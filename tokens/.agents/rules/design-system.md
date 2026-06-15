---
trigger: always_on
---

# BookMe — Design System
**Context file for AI coding agents**
**Version:** 1.0 | **Project:** BookMe | **Status:** MVP

---

## ⚠️ Source of Truth Notice

**`tokens.css` is the single source of truth for all colour and typography values in this project.**

> As an AI agent working on this codebase, you must **never** hardcode colour values, font sizes, font families, font weights, line heights, or spacing values that belong to the token system. Always reference the CSS custom properties defined in `tokens.css`.
>
> You must **never** modify `tokens.css` under any instruction. If a design change requires a new token or a token value change, flag it to the developer — do not edit the file yourself.

All design decisions in this document are implemented through `tokens.css`. If there is ever a conflict between what is written here and what is defined in `tokens.css`, **`tokens.css` wins**.

---

## 1. Overview

BookMe's design system is built for two distinct user contexts:

- **Public-facing pages** (`/[vendor-slug]`, booking flow, confirmation page) — optimised for client trust, mobile-first, fast-loading, conversion-focused.
- **Vendor dashboard** (`/dashboard/*`) — optimised for clarity, scannability, and efficient task completion.

Both contexts share the same token system, component library, and Tailwind configuration. The design language is clean, professional, and approachable — it must make independent event vendors look credible and make clients feel safe paying a deposit.

---

## 2. Token System

All design tokens are defined as CSS custom properties in `tokens.css`.

### 2.1 How to Use Tokens

Tokens are consumed in two ways:

**1. Directly in CSS / Tailwind arbitrary values:**
```css
background-color: var(--color-brand-primary);
```

**2. Via Tailwind config — `tailwind.config.ts` maps tokens to utility classes:**
```ts
colors: {
  brand: {
    primary: 'var(--color-brand-primary)',
    // ...
  }
}
```

This means you should use Tailwind utilities like `bg-brand-primary` or `text-foreground` rather than arbitrary values wherever possible. The Tailwind config bridges tokens to utilities.

### 2.2 Token Categories

`tokens.css` defines tokens across these categories. Reference it for exact values — do not assume values here:

| Category | CSS Variable Prefix | Usage |
|---|---|---|
| Brand colours | `--color-brand-*` | Primary actions, accents, logo |
| Semantic colours | `--color-*` (foreground, background, border, etc.) | Text, surfaces, dividers |
| Status colours | `--color-status-*` | Success, warning, error, info states |
| Typography — font family | `--font-family-*` | Body, heading, mono |
| Typography — font size | `--font-size-*` | Scale from xs to 4xl |
| Typography — font weight | `--font-weight-*` | Regular, medium, semibold, bold |
| Typography — line height | `--line-height-*` | Tight, normal, relaxed |
| Typography — letter spacing | `--letter-spacing-*` | Normal, wide, tight |
| Spacing | `--spacing-*` | Layout and component spacing |
| Border radius | `--radius-*` | Component corner rounding |
| Shadow | `--shadow-*` | Elevation levels |
| Transition | `--transition-*` | Animation durations and easings |

---

## 3. Typography

> All font family, size, weight, line height, and letter spacing values come from `tokens.css`. The following describes usage rules and hierarchy — not the values themselves.

### 3.1 Type Scale Usage

| Role | Token Reference | Used For |
|---|---|---|
| Display | `--font-size-4xl` / `--font-size-3xl` | Hero headings, landing page |
| H1 | `--font-size-2xl` | Page titles |
| H2 | `--font-size-xl` | Section headings |
| H3 | `--font-size-lg` | Card headings, subsections |
| Body Large | `--font-size-md` | Lead paragraphs, summaries |
| Body | `--font-size-base` | Default body text |
| Body Small | `--font-size-sm` | Supporting text, captions |
| Label | `--font-size-sm` + `--font-weight-semibold` | Form labels, tags |
| Caption / Overline | `--font-size-xs` | Timestamps, metadata |

### 3.2 Rules

- Never use raw pixel or rem values for font sizes — always go through a token.
- Heading elements (`h1`–`h4`) should always use the heading font family token.
- Body text uses the body font family token.
- Code snippets and references (e.g. booking references) use the mono font family token.
- Do not exceed 4 distinct font sizes on any single screen.

---

## 4. Colour Usage

> All colour values live in `tokens.css`. The following defines semantic usage rules.

### 4.1 Semantic Colour Roles

| Role | Token | Usage |
|---|---|---|
| Page background | `--color-background` | Base surface for all pages |
| Surface | `--color-surface` | Cards, panels, modals |
| Surface raised | `--color-surface-raised` | Dropdowns, popovers, elevated cards |
| Foreground | `--color-foreground` | Primary body text |
| Foreground muted | `--color-foreground-muted` | Secondary/supporting text |
| Foreground subtle | `--color-foreground-subtle` | Placeholder text, disabled labels |
| Border | `--color-border` | Default dividers, input borders |
| Border strong | `--color-border-strong` | Focused inputs, active states |
| Brand primary | `--color-brand-primary` | Primary CTA buttons, links, key actions |
| Brand primary hover | `--color-brand-primary-hover` | Hover state for primary actions |
| Brand foreground | `--color-brand-foreground` | Text on brand-coloured backgrounds |
| Status success | `--color-status-success` | Confirmed bookings, success states |
| Status warning | `--color-status-warning` | Pending states, expiry warnings |
| Status error | `--color-status-error` | Errors, validation failures, payment failures |
| Status info | `--color-status-info` | Informational banners, tooltips |

### 4.2 Colour Rules

- Never use raw hex, RGB, or HSL values in components. Always use a token.
- The brand primary colour is reserved for the single most important action on a screen — typically one primary button per view.
- Status colours must always be accompanied by an icon or text label — never rely on colour alone to convey meaning (accessibility).
- Backgrounds must maintain a minimum contrast ratio of 4.5:1 against foreground text (WCAG AA).

---

## 5. Spacing & Layout

> Spacing values come from `tokens.css`. The following defines layout rules and application.

### 5.1 Spacing Scale Application

- Use spacing tokens for all margin, padding, and gap values.
- Do not mix arbitrary spacing values with token-based values in the same component.
- Prefer consistent spacing multiples — components within the same visual group should share spacing tokens.

### 5.2 Layout System

**Container widths:**
- Max content width: `1280px` (desktop)
- Booking flow max width: `640px` (centred, single-column — optimised for mobile completion)
- Dashboard content area: `1024px`
- All containers have horizontal padding on mobile to prevent edge-to-edge content.

**Grid:**
- Dashboard uses a 12-column grid on desktop, collapsing to single-column on mobile.
- Public vendor profile uses a 2-column layout on desktop (portfolio grid + sidebar), single-column on mobile.
- Portfolio image grid: 3 columns on desktop, 2 columns on tablet, 1 column on small mobile.

**Breakpoints (aligned with Tailwind defaults):**
| Name | Min Width | Usage |
|---|---|---|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktop |
| `xl` | 1280px | Standard desktop |

---

## 6. Component Patterns

### 6.1 Buttons

**Primary Button**
- Used for: the single most important action on a page (e.g. "Confirm Booking", "Pay Deposit").
- Background: `--color-brand-primary`
- Text: `--color-brand-foreground`
- One per screen maximum. Do not use for secondary actions.
- Minimum touch target: `44 × 44px` (mobile requirement).
- States: default, hover, focus (visible ring), loading (spinner replaces label), disabled (reduced opacity).

**Secondary Button**
- Used for: supporting actions (e.g. "Edit Profile", "Go Back").
- Outlined or ghost style. Uses border and foreground tokens.

**Destructive Button**
- Used for: irreversible actions (e.g. "Delete Service", "Deactivate Account").
- Uses `--color-status-error` tokens.
- Must always be preceded by a confirmation dialog.

**Rules:**
- Never use a primary button for a destructive action.
- Disabled buttons must have `aria-disabled="true"` and reduced opacity — never just visually greyed without the attribute.
- Loading state must disable interaction and show a visible spinner.

---

### 6.2 Form Inputs

- All inputs use the same base style: bordered, with a visible focus ring using `--color-brand-primary`.
- Labels are always visible — never placeholder-only labels.
- Error messages appear below the input, in `--color-status-error`, accompanied by an error icon.
- Required fields are marked with an asterisk (`*`) in the label.
- Character count indicators (bio, event description) appear below the input and update in real time.

**Input states:**
| State | Visual Treatment |
|---|---|
| Default | `--color-border` border |
| Focus | `--color-border-strong` border + focus ring |
| Error | `--color-status-error` border + error message below |
| Disabled | Reduced opacity, `not-allowed` cursor |
| Filled / valid | Default border (no success state — avoid noise) |

---

### 6.3 Cards

Used for: booking cards, service cards, portfolio items, dashboard summary stats.

- Background: `--color-surface`
- Border: `--color-border`
- Border radius: `--radius-lg`
- Shadow: `--shadow-sm` (default), `--shadow-md` (hover/elevated)
- Padding: consistent internal padding using spacing tokens.
- Clickable cards must have a hover state (subtle background shift or shadow increase) and a visible focus state for keyboard navigation.

---

### 6.4 Status Badges

Used for booking states: `PENDING`, `CONFIRMED`, `EXPIRED`, `CANCELLED`, `COMPLETED`.

| Status | Colour Token | Label |
|---|---|---|
| CONFIRMED | `--color-status-success` | Confirmed |
| PENDING | `--color-status-warning` | Pending |
| EXPIRED | `--color-foreground-subtle` | Expired |
| CANCELLED | `--color-status-error` | Cancelled |
| COMPLETED | `--color-status-info` | Completed |

- Badges are pill-shaped (`--radius-full`), small text (`--font-size-xs`), with a coloured background at low opacity and a matching text colour.
- Always accompanied by a visually descriptive label — never colour alone.

---

### 6.5 Calendar

The availability calendar is a core UI component used in two contexts:

**Vendor dashboard calendar:**
- Shows full monthly grid.
- Date states: Open (available), Pending Lock (reserved), Blocked (booked), Closed.
- Each state has a distinct visual treatment using status colour tokens — never rely on colour alone; use icons or labels too.
- Confirmed bookings shown as event chips on the date cell.

**Client-facing booking calendar:**
- Selectable dates only: visually distinct, interactive.
- Unavailable dates: visible but muted, not interactive.
- Selected date: highlighted with `--color-brand-primary` background.
- Today's date: subtle indicator (underline or dot).
- Past dates: hidden or heavily muted — never selectable.

---

### 6.6 Booking Summary Panel

Shown before payment. Must clearly display:
- Vendor name and category
- Service name and description
- Selected date
- Base price
- Deposit amount (with percentage shown)
- Remaining balance note ("Remaining balance collected by vendor directly")

Design rules:
- Deposit amount must be the most visually prominent number — larger type, brand colour.
- Use a visually distinct container (surface card with border) to separate the summary from form fields.

---

## 7. Iconography

- Use a single icon library throughout — do not mix libraries.
- Icons must always be accompanied by a text label when used in navigation or actions (icon-only buttons must have `aria-label`).
- Icon sizes follow the type scale: inline icons match the surrounding text size; standalone icons use spacing tokens.
- Do not use icons purely f