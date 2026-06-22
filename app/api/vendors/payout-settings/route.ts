import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createFlutterwaveSubaccount } from "@/lib/flutterwave/create-subaccount"
import { logger } from "@/lib/logger"

const payoutSettingsSchema = z.object({
  account_bank: z.string().min(3),
  account_number: z.string().min(10),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vendorId = session.user.id
    const body = await req.json()
    const parsed = payoutSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Call Flutterwave to create subaccount
    const subaccountId = await createFlutterwaveSubaccount({
      account_bank: parsed.data.account_bank,
      account_number: parsed.data.account_number,
      business_name: vendor.name || `Vendor ${vendor.id}`,
      business_email: vendor.email,
      business_mobile: vendor.whatsappNumber || "09000000000",
    })

    // Save subaccountId to vendor
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { flwSubaccountId: subaccountId },
    })

    return NextResponse.json({ success: true, subaccountId })
  } catch (error) {
    logger.error("api.vendors.payout_settings.failed", error as Error)
    return NextResponse.json(
      { error: "Failed to set up payout settings. Please check your bank details." },
      { status: 500 }
    )
  }
}
