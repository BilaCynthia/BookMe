import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.enum([
    "PHOTOGRAPHER",
    "VIDEOGRAPHER",
    "DECORATOR",
    "CATERER",
    "MC_DJ",
    "MAKEUP_ARTIST",
    "EVENT_PLANNER",
    "OTHER",
  ]),
  location: z.string().min(2),
  instagramHandle: z.string().optional(),
  whatsappNumber: z.string().min(10),
  bio: z.string().max(300).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = profileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: session.user.id },
      data: {
        ...parsed.data,
        profileComplete: true,
      },
    })

    logger.info("vendor.profile.updated", { vendorId: session.user.id })

    return NextResponse.json(updatedVendor, { status: 200 })
  } catch (error) {
    logger.error("vendor.profile.update.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}
