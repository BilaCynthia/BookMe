import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { initiateBooking } from "@/lib/booking/initiate-booking"
import { BookingError } from "@/lib/errors"
import { logger } from "@/lib/logger"

const initiateBookingSchema = z.object({
  vendorId: z.string().cuid(),
  serviceId: z.string().cuid(),
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(10),
  eventDescription: z.string().max(300).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = initiateBookingSchema.safeParse(body)

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

    const eventDate = new Date(parsed.data.eventDate)

    const result = await initiateBooking({
      ...parsed.data,
      eventDate,
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      )
    }

    logger.error("booking.initiate.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    )
  }
}
