export interface InitiatePaymentParams {
  txRef: string                 // Unique: "bookme-[bookingId]-[timestamp]"
  amountNaira: number           // In naira (converted from kobo before calling)
  clientName: string
  clientEmail: string
  clientPhone: string
  vendorBusinessName: string
  serviceDescription: string
  redirectUrl: string           // Where Flutterwave sends client after payment
  meta?: Record<string, string> // e.g., { booking_reference: "BKM-XXXX" }
  subaccountId?: string         // Vendor's subaccount ID for split payouts
}

export interface InitiatePaymentResult {
  paymentUrl: string            // Flutterwave hosted checkout URL
  status: "success" | "error"
  message?: string
}

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
      ...(params.subaccountId && {
        subaccounts: [
          {
            id: params.subaccountId,
          },
        ],
      }),
    }),
  })

  const data = await response.json()

  if (data.status !== "success") {
    return { paymentUrl: "", status: "error", message: data.message }
  }

  return { paymentUrl: data.data.link, status: "success" }
}
