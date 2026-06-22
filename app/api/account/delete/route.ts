import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "You must be logged in." }, { status: 401 })
    }

    const vendorId = session.user.id

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Account not found." }, { status: 404 })
    }

    // Manual cascade delete for relations that do not have onDelete: Cascade
    // 1. Delete Refunds
    await prisma.refund.deleteMany({ where: { vendorId } })
    // 2. Delete Payments
    await prisma.payment.deleteMany({ where: { vendorId } })
    // 3. Delete QuoteRequests
    await prisma.quoteRequest.deleteMany({ where: { vendorId } })
    // 4. Delete Bookings (will also delete relations if any, but we deleted payments/refunds first)
    // Wait, AvailabilitySlot has a relation to Booking without cascade, so we must nullify or delete them.
    // Actually AvailabilitySlot has onDelete: Cascade for vendor, but if it's linked to Booking, deleting Booking might fail if AvailabilitySlot doesn't cascade.
    // Let's just delete AvailabilitySlots and Reservations first.
    await prisma.availabilitySlot.deleteMany({ where: { vendorId } })
    await prisma.reservation.deleteMany({ where: { vendorId } })
    
    await prisma.booking.deleteMany({ where: { vendorId } })

    // Hard delete — Prisma cascades to remaining related records (Service, Session, Account, PortfolioImage)
    await prisma.vendor.delete({ where: { id: vendorId } })

    logger.info("vendor.account.deleted", { vendorId, email: vendor.email })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("vendor.account.delete.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
