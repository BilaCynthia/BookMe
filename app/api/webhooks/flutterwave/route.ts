import { NextRequest, NextResponse } from "next/server"
import { validateFlutterwaveWebhook } from "@/lib/flutterwave/validate-webhook"
import { verifyFlutterwavePayment } from "@/lib/flutterwave/verify-payment"
import { confirmBooking } from "@/lib/booking/confirm-booking"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("verif-hash")

    // 1. Validate signature
    if (!validateFlutterwaveWebhook(rawBody, signature)) {
      logger.warn("webhook.signature_invalid", { signature })
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)

    // Only process charge.completed
    if (payload.event !== "charge.completed") {
      return NextResponse.json({ status: "ignored" }, { status: 200 })
    }

    const txRef = payload.data.tx_ref
    const flutterwaveId = payload.data.id

    // 2. Idempotency Check & Logging
    let webhookEvent = await prisma.webhookEvent.findFirst({
      where: { txRef, eventType: "charge.completed" },
    })

    if (webhookEvent && webhookEvent.processed) {
      logger.info("webhook.already_processed", { txRef })
      return NextResponse.json({ status: "already_processed" }, { status: 200 })
    }

    if (!webhookEvent) {
      webhookEvent = await prisma.webhookEvent.create({
        data: {
          provider: "flutterwave",
          eventType: "charge.completed",
          payload,
          txRef,
        },
      })
    }

    // 3. Verify Payment Authoritatively
    if (payload.data.status !== "successful") {
      logger.info("webhook.payment_not_successful", { txRef, status: payload.data.status })
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { processed: true, processedAt: new Date() },
      })
      return NextResponse.json({ status: "ignored" }, { status: 200 })
    }

    const verification = await verifyFlutterwavePayment(flutterwaveId)

    if (!verification.isValid) {
      logger.warn("webhook.verification_failed", { txRef, flutterwaveId })
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { error: "Verification failed (not successful)" },
      })
      return NextResponse.json({ error: "Verification failed" }, { status: 400 })
    }

    // Check against expected deposit amount in DB
    const booking = await prisma.booking.findUnique({
      where: { txRef },
      select: { depositAmount: true },
    })

    if (!booking) {
      logger.error("webhook.booking_not_found", new Error("Booking missing"), { txRef })
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { error: "Booking not found" },
      })
      return NextResponse.json({ status: "ignored" }, { status: 200 })
    }

    // Verify amount strictly
    const expectedAmountNaira = booking.depositAmount / 100
    if (verification.amountNaira < expectedAmountNaira) {
      logger.warn("webhook.amount_mismatch", { 
        txRef, 
        expected: expectedAmountNaira, 
        received: verification.amountNaira 
      })
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { error: `Amount mismatch: expected ${expectedAmountNaira}, got ${verification.amountNaira}` },
      })
      return NextResponse.json({ status: "amount_mismatch_ignored" }, { status: 200 })
    }

    // 4. Confirm Booking & Lock Slot
    await confirmBooking(txRef, String(flutterwaveId), webhookEvent.id)

    return NextResponse.json({ status: "success" }, { status: 200 })
  } catch (error) {
    logger.error("webhook.processing_error", error as Error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
