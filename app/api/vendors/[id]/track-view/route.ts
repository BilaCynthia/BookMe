import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    await prisma.vendor.update({
      where: { id },
      data: { profileViews: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("api.vendors.track_view.failed", error as Error)
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 })
  }
}
