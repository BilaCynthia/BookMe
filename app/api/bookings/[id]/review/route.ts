import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(500).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await req.json()
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { rating, review } = parsed.data

    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.rating !== null) {
      return NextResponse.json({ error: "Review already submitted for this booking." }, { status: 400 })
    }

    // Only allow reviews for CONFIRMED or COMPLETED bookings
    if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
      return NextResponse.json({ error: "Cannot review an unconfirmed booking." }, { status: 400 })
    }

    await prisma.booking.update({
      where: { id },
      data: {
        rating,
        review,
        reviewSubmittedAt: new Date(),
      },
    })

    // Optionally notify vendor
    await prisma.notification.create({
      data: {
        vendorId: booking.vendorId,
        title: "New Review Received! ⭐",
        message: `${booking.clientName} left a ${rating}-star review for their event.`,
        type: "SYSTEM",
        link: `/dashboard/bookings/${booking.id}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("api.bookings.review.failed", error as Error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
