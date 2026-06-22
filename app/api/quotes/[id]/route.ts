import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { sendQuoteToClient } from "@/lib/emails/send-quote-emails"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/quotes/[id]
 * Public route — returns quote details for client review page.
 * Vendor can also access their own quotes (auth).
 * Client personal data is included here since it's their own quote.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, name: true, description: true } },
        vendor: { select: { id: true, name: true, slug: true, profilePhoto: true } },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Quote not found." }, { status: 404 })
    }

    return NextResponse.json(quote)
  } catch (error) {
    logger.error("quote.get.failed", error as Error)
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 })
  }
}

const sendQuoteSchema = z.object({
  action: z.literal("send"),
  quotedPrice: z.number().min(1000, "Minimum quoted price is ₦1,000"),
  depositPercentage: z.number().int().min(10).max(100),
  vendorMessage: z.string().max(500).optional(),
})

const rejectQuoteSchema = z.object({
  action: z.literal("reject"),
})

/**
 * PATCH /api/quotes/[id]
 * Vendor sends a quote or rejects a request.
 * action: "send" | "reject"
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const { id } = await context.params
    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        service: { select: { name: true } },
        vendor: { select: { name: true } },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Quote not found." }, { status: 404 })
    }

    if (quote.vendorId !== session.user.id) {
      return NextResponse.json({ error: "FORBIDDEN", message: "You do not own this quote request." }, { status: 403 })
    }

    if (quote.status !== "PENDING") {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: `Cannot modify a quote with status: ${quote.status}` },
        { status: 409 }
      )
    }

    const body = await request.json()

    if (body.action === "send") {
      const parsed = sendQuoteSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 422 }
        )
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const updated = await prisma.quoteRequest.update({
        where: { id },
        data: {
          status: "QUOTED",
          quotedPrice: Math.round(parsed.data.quotedPrice * 100), // Naira → Kobo
          depositPercentage: parsed.data.depositPercentage,
          vendorMessage: parsed.data.vendorMessage,
          quotedAt: new Date(),
          expiresAt,
        },
      })

      logger.info("quote.sent", { quoteId: id, vendorId: session.user.id })

      // Email client synchronously to ensure delivery
      await sendQuoteToClient({
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        vendorName: quote.vendor.name || "Vendor",
        serviceName: quote.service.name,
        requestedDate: quote.requestedDate,
        quotedPrice: Math.round(parsed.data.quotedPrice * 100),
        depositPercentage: parsed.data.depositPercentage,
        vendorMessage: parsed.data.vendorMessage,
        quoteId: id,
        expiresAt,
      }).catch((err: unknown) => logger.error("quote.email.client.failed", err as Error))

      return NextResponse.json(updated)
    }

    if (body.action === "reject") {
      rejectQuoteSchema.parse(body)

      const updated = await prisma.quoteRequest.update({
        where: { id },
        data: { status: "REJECTED" },
      })

      logger.info("quote.rejected", { quoteId: id, vendorId: session.user.id })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 })
  } catch (error) {
    logger.error("quote.patch.failed", error as Error)
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 })
  }
}
