import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  businessName: z.string().min(2, "Business name must be at least 2 characters.").optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

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

    const { email, password, businessName } = parsed.data

    const existingVendor = await prisma.vendor.findUnique({
      where: { email },
    })

    if (existingVendor) {
      return NextResponse.json(
        { error: "EMAIL_EXISTS", message: "This email is already registered." },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const vendor = await prisma.vendor.create({
      data: {
        email,
        passwordHash,
        name: businessName || null,
        profileComplete: false,
      },
    })

    logger.info("vendor.registered", { vendorId: vendor.id, email })

    return NextResponse.json({ success: true, vendorId: vendor.id }, { status: 201 })
  } catch (error) {
    logger.error("vendor.registration.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}
