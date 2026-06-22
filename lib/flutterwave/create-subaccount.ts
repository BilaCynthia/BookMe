import { logger } from "@/lib/logger"

interface CreateSubaccountParams {
  account_bank: string
  account_number: string
  business_name: string
  business_email: string
  business_mobile: string
}

export async function createFlutterwaveSubaccount(params: CreateSubaccountParams) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY
  if (!secretKey) throw new Error("FLUTTERWAVE_SECRET_KEY is missing")

  try {
    const response = await fetch("https://api.flutterwave.com/v3/subaccounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_bank: params.account_bank,
        account_number: params.account_number,
        business_name: params.business_name,
        business_email: params.business_email,
        business_contact_mobile: params.business_mobile,
        business_mobile: params.business_mobile,
        country: "NG",
        split_type: "percentage",
        split_value: 0.95, // 95% goes to the subaccount (vendor)
      }),
    })

    const data = await response.json()

    if (!response.ok || data.status !== "success") {
      logger.error("flutterwave.create_subaccount.error", new Error(data.message || "Unknown error"))
      throw new Error(data.message || "Failed to create Flutterwave subaccount")
    }

    return data.data.subaccount_id as string
  } catch (error) {
    logger.error("flutterwave.create_subaccount.failed", error as Error)
    throw error
  }
}
