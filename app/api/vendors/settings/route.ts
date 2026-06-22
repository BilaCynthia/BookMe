import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { logger } from "@/lib/logger"

const settingsSchema = z.object({
  dailyCapacity: z.number().int().min(1).max(50),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = settingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: session.user.id },
      data: {
        dailyCapacity: parsed.data.dailyCapacity,
      },
    })

    logger.info("vendor.settings.updated", { vendorId: session.user.id })

    return NextResponse.json({ dailyCapacity: updatedVendor.dailyCapacity }, { status: 200 })
  } catch (error) {
    logger.error("vendor.settings.update.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}
