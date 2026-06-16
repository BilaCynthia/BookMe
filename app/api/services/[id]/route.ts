import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

// Zod schema for updating a service
const updateServiceSchema = z.object({
  name: z
    .string()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name must be 100 characters or less")
    .optional(),
  description: z
    .string()
    .min(2, "Description must be at least 2 characters")
    .max(200, "Description must be 200 characters or less")
    .optional(),
  basePrice: z
    .number()
    .min(1000, "Minimum price is ₦1,000")
    .max(100_000_000, "Maximum price is ₦100,000,000")
    .optional(),
  depositPercentage: z
    .number()
    .int("Deposit percentage must be a whole number")
    .min(10, "Minimum deposit is 10%")
    .max(100, "Maximum deposit is 100%")
    .optional(),
  isActive: z.boolean().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PUT /api/services/[id]
 * Updates a service. Enforces vendor ownership.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const { id } = await context.params

    // Verify vendor owns this service
    const existingService = await prisma.service.findUnique({
      where: { id },
      select: { vendorId: true },
    })

    if (!existingService) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Service not found." },
        { status: 404 }
      )
    }

    if (existingService.vendorId !== session.user.id) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "You do not own this service." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateServiceSchema.safeParse(body)

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

    // Build the update data, converting Naira to kobo if basePrice is provided
    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.basePrice !== undefined) {
      updateData.basePrice = Math.round(parsed.data.basePrice * 100)
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
    })

    logger.info("service.updated", {
      vendorId: session.user.id,
      serviceId: id,
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    logger.error("service.update.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/services/[id]
 * Soft-deletes a service by setting isActive = false.
 * We don't hard-delete because existing bookings reference this service.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const { id } = await context.params

    // Verify vendor owns this service
    const existingService = await prisma.service.findUnique({
      where: { id },
      select: { vendorId: true },
    })

    if (!existingService) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Service not found." },
        { status: 404 }
      )
    }

    if (existingService.vendorId !== session.user.id) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "You do not own this service." },
        { status: 403 }
      )
    }

    // Soft-delete: set isActive = false
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    })

    logger.info("service.deleted", {
      vendorId: session.user.id,
      serviceId: id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("service.delete.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}
