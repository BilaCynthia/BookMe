import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function expireStaleBookings(): Promise<{ bookings: number; quotes: number }> {
  const now = new Date()

  const staleBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    select: { id: true, vendorId: true, eventDate: true },
  })

  const staleQuotesCount = await prisma.quoteRequest.count({
    where: {
      status: "QUOTED",
      expiresAt: { lt: now },
    },
  })

  if (staleBookings.length === 0 && staleQuotesCount === 0) return { bookings: 0, quotes: 0 }

  await prisma.$transaction(async (tx) => {
    // 1. Expire Quotes
    if (staleQuotesCount > 0) {
      await tx.quoteRequest.updateMany({
        where: { status: "QUOTED", expiresAt: { lt: now } },
        data: { status: "EXPIRED" },
      })
    }

    // 2. Expire Bookings
    if (staleBookings.length > 0) {
      await tx.booking.updateMany({
        where: { id: { in: staleBookings.map((b) => b.id) } },
        data: { status: "EXPIRED" },
      })
    }

    // Release PENDING_LOCK on availability slots
    for (const booking of staleBookings) {
      await tx.availabilitySlot.updateMany({
        where: {
          vendorId: booking.vendorId,
          date: booking.eventDate,
          status: "PENDING_LOCK",
          bookingId: booking.id,
        },
        data: { status: "OPEN", bookingId: null },
      })
    }
  })

  logger.info("cron.expired", { bookings: staleBookings.length, quotes: staleQuotesCount })
  return { bookings: staleBookings.length, quotes: staleQuotesCount }
}
