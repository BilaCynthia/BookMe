import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { BookingError } from "@/lib/errors"
import { generateBookingReference } from "@/lib/booking/generate-reference"
import { acquireSlotLock } from "@/lib/availability/acquire-slot-lock"
import { initiateFlutterwavePayment } from "@/lib/flutterwave/initiate-payment"

interface InitiateBookingParams {
  vendorId: string
  serviceId: string
  eventDate: Date
  clientName: string
  clientEmail: string
  clientPhone: string
  eventDescription?: string
}

interface InitiateBookingResult {
  bookingId: string
  reference: string
  paymentUrl: string
  depositAmount: number
  expiresAt: Date
}

export async function initiateBooking(
  params: InitiateBookingParams
): Promise<InitiateBookingResult> {
  const [vendor, service] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id: params.vendorId, isActive: true },
      select: { id: true, name: true, contactEmail: true, flwSubaccountId: true },
    }),
    prisma.service.findUnique({
      where: { id: params.serviceId, vendorId: params.vendorId, isActive: true },
      select: { id: true, name: true, basePrice: true, depositPercentage: true },
    }),
  ])

  if (!vendor) throw new BookingError("VENDOR_NOT_FOUND", "Vendor not found.", 404)
  if (!service) throw new BookingError("SERVICE_INACTIVE", "This service is no longer available.", 409)

  const depositAmount = Math.floor(
    (service.basePrice * service.depositPercentage) / 100
  )

  const booking = await prisma.$transaction(async (tx) => {
    // Note: If allowMultipleBookings is true, capacity validation would require checking total bookings.
    // For now, BookMe restricts 1 booking per slot (OPEN -> PENDING_LOCK -> BLOCKED).
    // The acquireSlotLock enforces this atomically.

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 60 minutes
    const txRef = `bookme-${Date.now()}` 
    const reference = generateBookingReference()

    const newBooking = await tx.booking.create({
      data: {
        reference,
        vendorId: params.vendorId,
        serviceId: params.serviceId,
        clientName: params.clientName,
        clientEmail: params.clientEmail,
        clientPhone: params.clientPhone,
        eventDescription: params.eventDescription,
        eventDate: params.eventDate,
        basePrice: service.basePrice,
        depositPercentage: service.depositPercentage,
        depositAmount,
        status: "PENDING",
        expiresAt,
        txRef: `bookme-${txRef}-${Date.now()}`,
      },
    })

    const finalTxRef = `bookme-${newBooking.id}-${Date.now()}`
    await tx.booking.update({
      where: { id: newBooking.id },
      data: { txRef: finalTxRef },
    })

    await acquireSlotLock(tx, {
      vendorId: params.vendorId,
      date: params.eventDate,
      bookingId: newBooking.id,
    })

    return { ...newBooking, txRef: finalTxRef }
  })

  logger.info("booking.initiated", {
    bookingId: booking.id,
    vendorId: params.vendorId,
    eventDate: params.eventDate,
    depositAmount,
  })

  const paymentResult = await initiateFlutterwavePayment({
    txRef: booking.txRef!,
    amountNaira: depositAmount / 100,
    clientName: params.clientName,
    clientEmail: params.clientEmail,
    clientPhone: params.clientPhone,
    vendorBusinessName: vendor.name ?? "Vendor",
    serviceDescription: service.name,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${booking.reference}/confirmation`,
    meta: { booking_reference: booking.reference },
    subaccountId: vendor.flwSubaccountId || undefined,
  })

  if (paymentResult.status === "error") {
    logger.error("booking.payment.link.failed", new Error(paymentResult.message), {
      bookingId: booking.id,
    })
    throw new BookingError("PAYMENT_FAILED", "Unable to initiate payment. Please try again.", 502)
  }

  return {
    bookingId: booking.id,
    reference: booking.reference,
    paymentUrl: paymentResult.paymentUrl,
    depositAmount,
    expiresAt: booking.expiresAt,
  }
}
