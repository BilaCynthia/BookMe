import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vendorId = session.user.id
    const body = await req.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership and status
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        vendorId,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Only CONFIRMED bookings can have their balance marked as paid." },
        { status: 400 }
      )
    }

    if (booking.balancePaid) {
      return NextResponse.json(
        { error: "Balance is already marked as paid." },
        { status: 400 }
      )
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        balancePaid: true,
        balancePaidAt: new Date()
      },
    })

    return NextResponse.json({ success: true, message: "Balance marked as paid" })
  } catch (error) {
    console.error("Error updating balance:", error)
    return NextResponse.json(
      { error: "Failed to update balance" },
      { status: 500 }
    )
  }
}
