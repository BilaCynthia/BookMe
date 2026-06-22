import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { sendQuoteRequestReceivedVendor, sendQuoteRequestAcknowledgement } from "@/lib/emails/send-quote-emails"

const submitQuoteSchema = z.object({
  vendorId: z.string().cuid(),
  serviceId: z.string().cuid(),
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientEmail: z.string().email("Invalid email address"),
  clientPhone: z.string().min(7, "Invalid phone number"),
  requestedDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  requirements: z.string().min(10, "Please provide more detail (min 10 characters)").max(1000),
  guestCount: z.number().int().positive().optional(),
  eventType: z.string().max(100).optional(),
})

/**
 * POST /api/quotes
 * Client submits a quote request for a QUOTE_REQUIRED service.
 * Does NOT block the date. No payment involved.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = submitQuoteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { vendorId, serviceId, clientName, clientEmail, clientPhone, requestedDate, requirements, guestCount, eventType } = parsed.data

    // Verify service exists, belongs to vendor, and is QUOTE_REQUIRED
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { vendor: { select: { id: true, name: true, email: true } } },
    })

    if (!service || service.vendorId !== vendorId) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Service not found." }, { status: 404 })
    }

    if (service.serviceType !== "QUOTE_REQUIRED") {
      return NextResponse.json(
        { error: "INVALID_SERVICE_TYPE", message: "This service does not accept quote requests. Use the standard booking flow." },
        { status: 400 }
      )
    }

    if (!service.isActive) {
      return NextResponse.json({ error: "SERVICE_INACTIVE", message: "This service is no longer available." }, { status: 410 })
    }

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        vendorId,
        serviceId,
        clientName,
        clientEmail: clientEmail.toLowerCase(),
        clientPhone,
        requestedDate: new Date(requestedDate),
        requirements,
        guestCount,
        eventType,
        status: "PENDING",
      },
    })

    // Create Notification

    await prisma.notification.create({
      data: {
        vendorId,
        title: "New Quote Request",
        message: `${clientName} requested a quote for ${service.name}.`,
        type: "QUOTE",
        link: `/dashboard/quotes`,
      },
    })

    logger.info("quote.request.submitted", { quoteId: quoteRequest.id, vendorId, serviceId })

    // Send emails synchronously to ensure they complete before serverless function exits
    await Promise.all([
      sendQuoteRequestReceivedVendor({
        vendorName: service.vendor.name || "Vendor",
        vendorEmail: service.vendor.email,
        clientName,
        clientEmail,
        serviceName: service.name,
        requestedDate: new Date(requestedDate),
        requirements,
        guestCount,
        quoteId: quoteRequest.id,
      }),
      sendQuoteRequestAcknowledgement({
        clientName,
        clientEmail,
        vendorName: service.vendor.name || "Vendor",
        serviceName: service.name,
        requestedDate: new Date(requestedDate),
      }),
    ]).catch((err: unknown) => logger.error("quote.email.failed", err as Error))

    return NextResponse.json({ success: true, quoteId: quoteRequest.id }, { status: 201 })
  } catch (error) {
    logger.error("quote.submit.failed", error as Error)
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 })
  }
}

/**
 * GET /api/quotes
 * Vendor fetches their quote requests, filterable by status.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const quotes = await prisma.quoteRequest.findMany({
      where: {
        vendorId: session.user.id,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(quotes)
  } catch (error) {
    logger.error("quotes.list.failed", error as Error)
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 })
  }
}
