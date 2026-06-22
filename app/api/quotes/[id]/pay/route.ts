import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { BookingError } from "@/lib/errors"
import { generateBookingReference } from "@/lib/booking/generate-reference"
import { acquireSlotLock } from "@/lib/availability/acquire-slot-lock"
import { initiateFlutterwavePayment } from "@/lib/flutterwave/initiate-payment"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/quotes/[id]/pay
 * Client initiates deposit payment from an accepted quote.
 * Creates a Booking, acquires a slot lock, and redirects to Flutterwave.
 * Reuses the entire existing payment infrastructure.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true, isActive: true, flwSubaccountId: true } },
        service: { select: { id: true, name: true, isActive: true } },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Quote not found." }, { status: 404 })
    }

    if (quote.status !== "QUOTED") {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: "This quote is no longer available for payment." },
        { status: 409 }
      )
    }

    if (!quote.quotedPrice || !quote.depositPercentage) {
      return NextResponse.json({ error: "QUOTE_INCOMPLETE", message: "Quote is missing price details." }, { status: 400 })
    }

    // Check expiry
    if (quote.expiresAt && new Date() > quote.expiresAt) {
      await prisma.quoteRequest.update({ where: { id }, data: { status: "EXPIRED" } })
      return NextResponse.json({ error: "QUOTE_EXPIRED", message: "This quote has expired. Please request a new one." }, { status: 410 })
    }

    if (!quote.vendor.isActive) {
      return NextResponse.json({ error: "VENDOR_INACTIVE", message: "This vendor is no longer active." }, { status: 410 })
    }

    const depositAmount = Math.floor((quote.quotedPrice * quote.depositPercentage) / 100)

    const booking = await prisma.$transaction(async (tx) => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
      const reference = generateBookingReference()

      const newBooking = await tx.booking.create({
        data: {
          reference,
          vendorId: quote.vendorId,
          serviceId: quote.serviceId,
          clientName: quote.clientName,
          clientEmail: quote.clientEmail,
          clientPhone: quote.clientPhone,
          eventDescription: quote.requirements,
          eventDate: quote.requestedDate,
          basePrice: quote.quotedPrice!,
          depositPercentage: quote.depositPercentage!,
          depositAmount,
          status: "PENDING",
          expiresAt,
          txRef: `bookme-temp-${Date.now()}`,
        },
      })

      const finalTxRef = `bookme-${newBooking.id}-${Date.now()}`
      await tx.booking.update({ where: { id: newBooking.id }, data: { txRef: finalTxRef } })

      // Link quote to this booking
      await tx.quoteRequest.update({
        where: { id: quote.id },
        data: { bookingId: newBooking.id },
      })

      await acquireSlotLock(tx, {
        vendorId: quote.vendorId,
        date: quote.requestedDate,
        bookingId: newBooking.id,
      })

      return { ...newBooking, txRef: finalTxRef }
    })

    logger.info("quote.payment.initiated", {
      quoteId: id,
      bookingId: booking.id,
      vendorId: quote.vendorId,
      depositAmount,
    })

    const paymentResult = await initiateFlutterwavePayment({
      txRef: booking.txRef!,
      amountNaira: depositAmount / 100,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      vendorBusinessName: quote.vendor.name ?? "Vendor",
      serviceDescription: quote.service.name,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${booking.reference}/confirmation`,
      meta: { booking_reference: booking.reference, quote_id: id },
      subaccountId: quote.vendor.flwSubaccountId || undefined,
    })

    if (paymentResult.status === "error") {
      throw new BookingError("PAYMENT_FAILED", "Unable to initiate payment. Please try again.", 502)
    }

    return NextResponse.json({ success: true, paymentUrl: paymentResult.paymentUrl }, { status: 200 })
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: error.statusCode })
    }
    logger.error("quote.pay.failed", error as Error)
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 })
  }
}
