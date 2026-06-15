# Skill: Flutterwave Integration

## Purpose

This skill covers every aspect of integrating Flutterwave into BookMe.
Flutterwave is the **only** payment provider for this product.
Use this skill whenever you are building, modifying, or debugging anything related to payment initiation, webhook processing, payment verification, or payout logic.

---

## When to Use This Skill

- Initiating a Flutterwave payment from a booking
- Processing incoming Flutterwave webhooks
- Verifying a payment against the Flutterwave API
- Handling payment failures and retries
- Implementing split payments for platform commission
- Writing or testing webhook security (signature validation)
- Debugging payment state mismatches

---

## Critical Rules

1. **Never use Paystack, Stripe, or any other payment provider.** Flutterwave only.
2. **Never confirm a booking based solely on the webhook payload.** Always re-verify via the Flutterwave Verify Transaction API.
3. **Always validate the webhook signature** before reading the payload.
4. **Always use `crypto.timingSafeEqual`** for signature comparison — never `===`.
5. **Webhook handlers must be idempotent.** Check `WebhookEvent.processed` before acting.
6. **All amounts passed to Flutterwave are in Naira (NGN).** Convert from kobo before initiating payment.
7. **The `tx_ref` must be unique per payment attempt.** Use `bookme-[bookingId]-[timestamp]`.
8. **Flutterwave expects a response within 5 seconds.** Keep webhook processing fast; offload heavy work.

---

## Environment Variables Required

```bash
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-...        # Safe for client-side inline checkout
FLUTTERWAVE_SECRET_KEY=FLWSECK-...        # Server-only. Never expose to client.
FLUTTERWAVE_WEBHOOK_SECRET=...            # Used to validate incoming webhook signatures
FLUTTERWAVE_ENCRYPTION_KEY=...            # Used for encrypted inline charges
```

---

## File Locations

```
lib/
└── flutterwave/
    ├── initiate-payment.ts       # Creates Flutterwave payment link
    ├── verify-payment.ts         # Verifies a transaction via Flutterwave API
    └── validate-webhook.ts       # HMAC-SHA256 signature validation

app/
└── api/
    └── webhooks/
        └── flutterwave/
            └── route.ts          # Webhook endpoint — see resources/webhook-handler.ts
```

---

## Payment Initiation

### What it does

Calls the Flutterwave Payments API to generate a hosted checkout URL.
The client is redirected to this URL to complete payment.

### Interface

```typescript
interface InitiatePaymentParams {
  txRef: string                 // Unique: "bookme-[bookingId]-[timestamp]"
  amountNaira: number           // In naira (converted from kobo before calling)
  clientName: string
  clientEmail: string
  clientPhone: string
  vendorBusinessName: string
  serviceDescription: string
  redirectUrl: string           // Where Flutterwave sends client after payment
  meta?: Record<string, string> // e.g., { booking_reference: "BKM-XXXX" }
}

interface InitiatePaymentResult {
  paymentUrl: string            // Flutterwave hosted checkout URL
  status: "success" | "error"
  message?: string
}
```

### Implementation

```typescript
// lib/flutterwave/initiate-payment.ts
export async function initiateFlutterwavePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amountNaira,
      currency: "NGN",
      redirect_url: params.redirectUrl,
      customer: {
        email: params.clientEmail,
        phone_number: params.clientPhone,
        name: params.clientName,
      },
      customizations: {
        title: "BookMe Deposit",
        description: `Deposit for ${params.serviceDescription} — ${params.vendorBusinessName}`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
      },
      meta: params.meta ?? {},
      payment_options: "card, banktransfer, ussd",
    }),
  })

  const data = await response.json()

  if (data.status !== "success") {
    return { paymentUrl: "", status: "error", message: data.message }
  }

  return { paymentUrl: data.data.link, status: "success" }
}
```

---

## Payment Verification

### What it does

Re-verifies a transaction directly with Flutterwave using the transaction ID from the webhook.
This is the authoritative check — the webhook payload is only a notification, not proof.

### Interface

```typescript
interface VerificationResult {
  isValid: boolean
  amountNaira: number
  currency: string
  status: "successful" | "failed" | "pending"
  txRef: string
  flutterwaveId: number
  customerEmail: string
}
```

### Implementation

```typescript
// lib/flutterwave/verify-payment.ts
export async function verifyFlutterwavePayment(
  transactionId: string | number
): Promise<VerificationResult> {
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Flutterwave verification API returned ${response.status}`)
  }

  const data = await response.json()
  const tx = data.data

  return {
    isValid: tx.status === "successful",
    amountNaira: tx.amount,
    currency: tx.currency,
    status: tx.status,
    txRef: tx.tx_ref,
    flutterwaveId: tx.id,
    customerEmail: tx.customer.email,
  }
}
```

---

## Webhook Validation

```typescript
// lib/flutterwave/validate-webhook.ts
import crypto from "crypto"

export function validateFlutterwaveWebhook(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false

  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET
  if (!secret) throw new Error("FLUTTERWAVE_WEBHOOK_SECRET not configured")

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expected, "utf8")
    )
  } catch {
    return false
  }
}
```

---

## Webhook Payload Shape (Flutterwave charge.completed)

```typescript
interface FlutterwaveWebhookPayload {
  event: "charge.completed"
  data: {
    id: number                  // Flutterwave transaction ID
    tx_ref: string              // Your unique reference (bookme-[bookingId]-[ts])
    flw_ref: string             // Flutterwave's internal reference
    amount: number              // Amount in NGN (naira)
    currency: string            // "NGN"
    status: "successful" | "failed" | "pending"
    payment_type: string        // "card" | "banktransfer" | "ussd"
    customer: {
      id: number
      name: string
      email: string
      phone_number: string
    }
    meta: Record<string, string>
  }
}
```

---

## Error Scenarios

| Scenario | Handling |
|---|---|
| Invalid webhook signature | Return 401. Log the attempt. Do not process. |
| Already-processed webhook | Return 200. Do nothing. Log idempotency hit. |
| Payment status is not "successful" | Return 200. Update booking to EXPIRED. Log. |
| Verification amount < expected deposit | Return 200. Do not confirm. Log discrepancy. Flag for review. |
| Flutterwave verify API timeout | Retry webhook processing (up to 3 times, 30s apart). |
| Booking not found for tx_ref | Return 200. Log as orphaned webhook. Alert ops. |
| Booking already CONFIRMED | Return 200. Idempotency. Do nothing. |

---

## Testing

Test the webhook handler with mock payloads.
Use the Flutterwave test keys and test card numbers in development:

```
Test Card: 4187427415564246
CVV: 828
Expiry: 09/32
PIN: 3310
OTP: 12345
```

Test webhook signature generation:
```typescript
import crypto from "crypto"

const secret = "your_test_webhook_secret"
const payload = JSON.stringify({ event: "charge.completed", data: { ... } })
const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex")
// Use this value as the "verif-hash" header in your test request
```

---

## Reference Files

- Full webhook handler implementation: `skills/flutterwave-integration/resources/webhook-handler.ts`
- Flutterwave API docs: https://developer.flutterwave.com/docs
- Flutterwave webhook events: https://developer.flutterwave.com/docs/integration-guides/webhooks
