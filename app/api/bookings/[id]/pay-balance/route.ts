import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { initiateFlutterwavePayment } from "@/lib/flutterwave/initiate-payment"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true, flwSubaccountId: true } },
        service: { select: { name: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Booking not found." }, { status: 404 })
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: "Only confirmed bookings can have balances paid." },
        { status: 400 }
      )
    }

    if (booking.balancePaid) {
      return NextResponse.json(
        { error: "ALREADY_PAID", message: "The balance for this booking has already been paid." },
        { status: 400 }
      )
    }

    const balanceAmountKobo = booking.basePrice - booking.depositAmount

    if (balanceAmountKobo <= 0) {
      return NextResponse.json(
        { error: "NO_BALANCE", message: "There is no outstanding balance for this booking." },
        { status: 400 }
      )
    }

    // Generate a unique txRef for the balance payment
    const txRef = `bookme-balance-${booking.id}-${Date.now()}`

    const paymentResult = await initiateFlutterwavePayment({
      txRef,
      amountNaira: balanceAmountKobo / 100,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      vendorBusinessName: booking.vendor.name ?? "Vendor",
      serviceDescription: `${booking.service.name} (Final Balance)`,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${booking.reference}/confirmation?type=balance`,
      meta: { 
        booking_reference: booking.reference,
        payment_type: "BALANCE",
        booking_id: booking.id 
      },
      subaccountId: booking.vendor.flwSubaccountId || undefined,
    })

    if (paymentResult.status === "error") {
      logger.error("balance.payment.link.failed", new Error(paymentResult.message), {
        bookingId: booking.id,
      })
      return NextResponse.json(
        { error: "PAYMENT_FAILED", message: "Unable to initiate payment. Please try again." },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, paymentUrl: paymentResult.paymentUrl })
  } catch (error) {
    logger.error("api.bookings.pay_balance.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}
