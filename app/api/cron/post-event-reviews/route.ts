import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendReviewRequest } from "@/lib/emails/send-review-request"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * GET /api/cron/post-event-reviews
 * Triggered daily by Vercel Cron.
 * Finds all CONFIRMED/COMPLETED bookings where the event was exactly 1 day ago.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Target date: exactly 1 day ago
    const targetDate = new Date()
    targetDate.setUTCDate(targetDate.getUTCDate() - 1)
    targetDate.setUTCHours(0, 0, 0, 0)
    
    const endOfTargetDate = new Date(targetDate)
    endOfTargetDate.setUTCHours(23, 59, 59, 999)

    // Find bookings where event was yesterday and no review has been submitted yet
    const pastBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        eventDate: {
          gte: targetDate,
          lte: endOfTargetDate,
        },
        rating: null,
      },
      include: {
        vendor: { select: { name: true } },
        service: { select: { name: true } },
      },
    })

    if (pastBookings.length === 0) {
      return NextResponse.json({ status: "success", count: 0, message: "No reviews to request." })
    }

    let successCount = 0
    let failCount = 0

    for (const booking of pastBookings) {
      try {
        // Also update status to COMPLETED if it's still CONFIRMED
        if (booking.status === "CONFIRMED") {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: "COMPLETED" },
          })
        }

        const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL}/booking/${booking.reference}/review`

        await sendReviewRequest({
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          vendorName: booking.vendor.name ?? "Vendor",
          serviceName: booking.service.name,
          eventDate: booking.eventDate,
          reviewLink,
        })

        successCount++
      } catch (err) {
        logger.error(`Failed to send review request for booking ${booking.id}`, err as Error)
        failCount++
      }
    }

    logger.info("cron.review_requests.completed", { successCount, failCount })
    
    return NextResponse.json({ 
      status: "success", 
      processed: successCount + failCount,
      successCount,
      failCount 
    })
  } catch (error) {
    logger.error("cron.review_requests.error", error as Error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
