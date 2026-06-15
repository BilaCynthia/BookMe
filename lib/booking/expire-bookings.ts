import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function expireStaleBookings(): Promise<number> {
  const now = new Date()

  const staleBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    select: { id: true, vendorId: true, eventDate: true },
  })

  if (staleBookings.length === 0) return 0

  await prisma.$transaction(async (tx) => {
    // Expire all stale PENDING bookings
    await tx.booking.updateMany({
      where: { id: { in: staleBookings.map((b) => b.id) } },
      data: { status: "EXPIRED" },
    })

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

  logger.info("bookings.expired", { count: staleBookings.length })
  return staleBookings.length
}
