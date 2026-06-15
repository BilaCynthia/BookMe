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
  // Attempt to lock the row
  const result = await tx.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM "availability_slots"
    WHERE "vendorId" = ${params.vendorId}
      AND date = ${params.date}::date
      AND status = 'OPEN'::"AvailabilityStatus"
    FOR UPDATE NOWAIT
  `

  if (result.length === 0) {
    throw new BookingError(
      "DATE_UNAVAILABLE",
      "This date is no longer available. Please select another date.",
      409
    )
  }

  const slotId = result[0].id

  // Set status to PENDING_LOCK
  await tx.availabilitySlot.update({
    where: { id: slotId },
    data: {
      status: "PENDING_LOCK",
      bookingId: params.bookingId,
    },
  })

  return slotId
}
