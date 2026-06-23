import { AvailabilityStatus } from "@prisma/client"
import { prisma } from "@/lib/db"

/**
 * Recalculates and updates the status of an AvailabilitySlot based on the vendor's daily capacity
 * and the number of active bookings/reservations for that date.
 */
export async function updateSlotStatus(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  vendorId: string,
  date: Date
): Promise<void> {
  // Lock the slot
  const slotResult = await tx.$queryRaw<{ id: string, status: string }[]>`
    SELECT id, status
    FROM "availability_slots"
    WHERE "vendorId" = ${vendorId}
      AND date = ${date}::date
    FOR UPDATE
  `

  if (slotResult.length === 0) return // No slot means the date is not opened by the vendor
  const slot = slotResult[0]

  // If vendor manually closed it, leave it CLOSED
  if (slot.status === 'CLOSED') return

  // Get vendor capacity
  const vendor = await tx.vendor.findUnique({
    where: { id: vendorId },
    select: { dailyCapacity: true }
  })
  if (!vendor) return

  const capacity = vendor.dailyCapacity

  const now = new Date()

  // Count active pending bookings
  const pendingBookings = await tx.booking.count({
    where: {
      vendorId,
      eventDate: date,
      status: "PENDING",
      expiresAt: { gt: now }
    }
  })

  // Count confirmed bookings
  const confirmedBookings = await tx.booking.count({
    where: {
      vendorId,
      eventDate: date,
      status: "CONFIRMED"
    }
  })

  const totalOccupied = pendingBookings + confirmedBookings

  let newStatus: AvailabilityStatus = 'OPEN'
  if (totalOccupied >= capacity) {
    if (pendingBookings > 0 && confirmedBookings < capacity) {
      newStatus = 'PENDING_LOCK'
    } else {
      newStatus = 'BLOCKED'
    }
  }

  if (newStatus !== slot.status) {
    await tx.availabilitySlot.update({
      where: { id: slot.id },
      data: { status: newStatus }
    })
  }
}
