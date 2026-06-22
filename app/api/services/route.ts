import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

// Zod schema for creating a new service
// basePrice is received in Naira from the UI, converted to kobo in the handler
const createServiceSchema = z.object({
  name: z
    .string()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name must be 100 characters or less"),
  description: z
    .string()
    .min(2, "Description must be at least 2 characters")
    .max(200, "Description must be 200 characters or less"),
  serviceType: z.enum(["FIXED_PRICE", "QUOTE_REQUIRED"]).default("FIXED_PRICE"),
  basePrice: z
    .number()
    .min(1000, "Minimum price is ₦1,000")
    .max(100_000_000, "Maximum price is ₦100,000,000")
    .optional(),
  depositPercentage: z
    .number()
    .int("Deposit percentage must be a whole number")
    .min(10, "Minimum deposit is 10%")
    .max(100, "Maximum deposit is 100%"),
}).refine(
  (data) => data.serviceType === "QUOTE_REQUIRED" || data.basePrice !== undefined,
  { message: "Base price is required for Fixed Price services", path: ["basePrice"] }
)

/**
 * GET /api/services
 * Returns all services for the authenticated vendor.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const services = await prisma.service.findMany({
      where: { vendorId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(services)
  } catch (error) {
    logger.error("services.list.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}

/**
 * POST /api/services
 * Creates a new service for the authenticated vendor.
 * basePrice is received in Naira and stored in kobo (×100).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createServiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    // Convert Naira to kobo for storage (0 for QUOTE_REQUIRED services)
    const basePriceKobo = parsed.data.serviceType === "QUOTE_REQUIRED"
      ? 0
      : Math.round((parsed.data.basePrice ?? 0) * 100)

    const service = await prisma.service.create({
      data: {
        vendorId: session.user.id,
        name: parsed.data.name,
        description: parsed.data.description,
        serviceType: parsed.data.serviceType,
        basePrice: basePriceKobo,
        depositPercentage: parsed.data.depositPercentage,
      },
    })

    logger.info("service.created", {
      vendorId: session.user.id,
      serviceId: service.id,
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    logger.error("service.create.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}
