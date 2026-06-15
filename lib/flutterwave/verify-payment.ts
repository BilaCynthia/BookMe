export interface VerificationResult {
  isValid: boolean
  amountNaira: number
  currency: string
  status: "successful" | "failed" | "pending"
  txRef: string
  flutterwaveId: number
  customerEmail: string
}

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
