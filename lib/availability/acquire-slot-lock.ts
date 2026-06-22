import { prisma } from "@/lib/db"
import { BookingError } from "@/lib/errors"

interface AcquireSlotLockParams {
  vendorId: string
  date: Date
  bookingId: string
}

/**
 * Attempts to acquire a pessimistic lock on an OPEN availability slot.
 * Uses SELECT FOR UPDATE NOWAIT — fails immediately if another transaction holds the lock.
 * Must be called INSIDE a Prisma transaction.
 */
export async function acquireSlotLock(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: AcquireSlotLockParams
): Promise<string> {
  // Attempt to lock the row without restricting by status
  const result = await tx.$queryRaw<{ id: string, status: string }[]>`
    SELECT id, status
    FROM "availability_slots"
    WHERE "vendorId" = ${params.vendorId}
      AND date = ${params.date}::date
    FOR UPDATE NOWAIT
  `

  if (result.length === 0 || result[0].status === 'CLOSED') {
    throw new BookingError(
      "DATE_UNAVAILABLE",
      "This date is no longer available. Please select another date.",
      409
    )
  }

  const slotId = result[0].id

  // Verify capacity
  const vendor = await tx.vendor.findUnique({
    where: { id: params.vendorId },
    select: { dailyCapacity: true }
  })
  if (!vendor) throw new Error("Vendor not found")

  const now = new Date()
  const activeBookings = await tx.booking.count({
    where: {
      vendorId: params.vendorId,
      eventDate: params.date,
      OR: [
        { status: "CONFIRMED" },
        { status: "PENDING", expiresAt: { gt: now } }
      ]
    }
  })

  // We add 1 because the current booking is already created as PENDING in the transaction before calling this,
  // but let's be careful: is the booking already created when acquireSlotLock is called?
  // Yes, initiateBooking does tx.booking.create THEN acquireSlotLock.
  // So activeBookings already includes the current booking!
  if (activeBookings > vendor.dailyCapacity) {
    throw new BookingError(
      "DATE_UNAVAILABLE",
      "This date is no longer available. Please select another date.",
      409
    )
  }

  // Update status based on new capacity
  const { updateSlotStatus } = await import("./update-slot-status")
  await updateSlotStatus(tx, params.vendorId, params.date)

  return slotId
}
