import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendBookingConfirmation } from "@/lib/emails/send-booking-confirmation"

export async function confirmBooking(
  txRef: string,
  flutterwaveId: string,
  webhookEventId: string
): Promise<void> {
  const bookingData = await prisma.$transaction(async (tx) => {
    // Find pending booking
    const booking = await tx.booking.findUnique({
      where: { txRef },
      include: {
        vendor: { select: { id: true, name: true, contactEmail: true } },
        service: { select: { name: true } },
      },
    })

    if (!booking) throw new Error(`Booking not found for txRef: ${txRef}`)
    if (booking.status === "CONFIRMED") {
      // Idempotent — already confirmed
      return null
    }
    if (booking.status !== "PENDING") {
      throw new Error(`Booking ${booking.id} is in unexpected state: ${booking.status}`)
    }

    // Update booking to CONFIRMED
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        paidAt: new Date(),
        paymentReference: flutterwaveId,
      },
    })

    // If this booking originated from a quote request, mark quote as ACCEPTED
    const quoteReq = await tx.quoteRequest.findUnique({
      where: { bookingId: booking.id },
      select: { id: true },
    })
    if (quoteReq) {
      await tx.quoteRequest.update({
        where: { id: quoteReq.id },
        data: { status: "ACCEPTED" },
      })
    }

    // Block the availability slot
    await tx.availabilitySlot.upsert({
      where: {
        vendorId_date: {
          vendorId: booking.vendorId,
          date: booking.eventDate,
        },
      },
      update: { status: "BLOCKED", bookingId: booking.id },
      create: {
        vendorId: booking.vendorId,
        date: booking.eventDate,
        status: "BLOCKED",
        bookingId: booking.id,
      },
    })

    // Create payment record
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        vendorId: booking.vendorId,
        amount: booking.depositAmount,
        currency: "NGN",
        txRef: txRef,
        flwRef: flutterwaveId,
        status: "SUCCESS",
      },
    })

    // Mark webhook as processed
    await tx.webhookEvent.update({
      where: { id: webhookEventId },
      data: { processed: true, processedAt: new Date() },
    })

    // Create Notification for the vendor
    await tx.notification.create({
      data: {
        vendorId: booking.vendorId,
        title: "New Booking Confirmed! 🎉",
        message: `${booking.clientName} booked ${booking.service.name} for ${booking.eventDate.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}.`,
        type: "BOOKING",
        link: `/dashboard/bookings/${booking.id}`,
      },
    })

    return booking
  })

  logger.info("booking.confirmed", { txRef, flutterwaveId })

  if (bookingData) {
    // Send emails asynchronously, don't wait for them
    sendBookingConfirmation({
      reference: bookingData.reference,
      clientName: bookingData.clientName,
      clientEmail: bookingData.clientEmail,
      vendorName: bookingData.vendor.name ?? "Vendor",
      vendorEmail: bookingData.vendor.contactEmail ?? "hello@bookme.com",
      serviceName: bookingData.service.name,
      eventDate: bookingData.eventDate,
      depositAmountNaira: bookingData.depositAmount / 100,
    }).catch((err) => {
      logger.error("email.send.error", err)
    })
  }
}

