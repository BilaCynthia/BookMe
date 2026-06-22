import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendBalanceReminder } from "@/lib/emails/send-balance-reminder"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * GET /api/cron/balance-reminders
 * Triggered daily by Vercel Cron.
 * Finds all CONFIRMED bookings with an unpaid balance where the event is exactly 2 days away.
 */
export async function GET(request: Request) {
  // Optional: Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Target date: exactly 2 days from today
    const targetDate = new Date()
    targetDate.setUTCDate(targetDate.getUTCDate() + 2)
    targetDate.setUTCHours(0, 0, 0, 0)
    
    // We want the end of the target day to catch all events on that date
    const endOfTargetDate = new Date(targetDate)
    endOfTargetDate.setUTCHours(23, 59, 59, 999)

    const pendingBalances = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        balancePaid: false,
        eventDate: {
          gte: targetDate,
          lte: endOfTargetDate,
        },
      },
      include: {
        vendor: { select: { name: true, contactEmail: true } },
        service: { select: { name: true } },
      },
    })

    if (pendingBalances.length === 0) {
      return NextResponse.json({ status: "success", count: 0, message: "No reminders needed." })
    }

    let successCount = 0
    let failCount = 0

    // Process reminders sequentially or in small batches
    for (const booking of pendingBalances) {
      try {
        const balanceAmountKobo = booking.basePrice - booking.depositAmount
        
        // Skip if basePrice == depositAmount
        if (balanceAmountKobo <= 0) continue

        const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/booking/${booking.reference}/balance`

        await sendBalanceReminder({
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          vendorName: booking.vendor.name ?? "Vendor",
          serviceName: booking.service.name,
          eventDate: booking.eventDate,
          balanceAmountNaira: balanceAmountKobo / 100,
          paymentLink,
        })

        successCount++
      } catch (err) {
        logger.error(`Failed to send balance reminder for booking ${booking.id}`, err as Error)
        failCount++
      }
    }

    logger.info("cron.balance_reminders.completed", { successCount, failCount })
    
    return NextResponse.json({ 
      status: "success", 
      processed: successCount + failCount,
      successCount,
      failCount 
    })
  } catch (error) {
    logger.error("cron.balance_reminders.error", error as Error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
