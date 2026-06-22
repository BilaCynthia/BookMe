import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { startOfDay, isBefore, startOfToday } from "date-fns"

// POST /api/availability — Open new dates
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vendorId = session.user.id
    const body = await req.json()
    const { dates } = body as { dates: string[] }

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one date" },
        { status: 400 }
      )
    }

    // Allow up to 400 dates to support the 'Next 1 Year' bulk action (365 days)
    if (dates.length > 400) {
      return NextResponse.json(
        { error: "You can open a maximum of 400 dates at a time" },
        { status: 400 }
      )
    }

    const today = startOfToday()
    const validDates: Date[] = []

    for (const dateStr of dates) {
      const date = startOfDay(new Date(dateStr))
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: `Invalid date: ${dateStr}` },
          { status: 400 }
        )
      }
      if (isBefore(date, today)) {
        return NextResponse.json(
          { error: `Cannot open a past date: ${dateStr}` },
          { status: 400 }
        )
      }
      validDates.push(date)
    }

    // Use createMany with skipDuplicates to avoid errors on already-open dates
    const result = await prisma.availabilitySlot.createMany({
      data: validDates.map((date) => ({
        vendorId,
        date,
        status: "OPEN" as const,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json(
      { message: `${result.count} date(s) opened successfully`, count: result.count },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error opening dates:", error)
    return NextResponse.json(
      { error: "Failed to open dates" },
      { status: 500 }
    )
  }
}

// DELETE /api/availability — Close a specific date
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vendorId = session.user.id
    const { searchParams } = new URL(req.url)
    const slotId = searchParams.get("id")

    if (!slotId) {
      return NextResponse.json(
        { error: "Slot ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership and that the slot is OPEN (can't close booked dates)
    const slot = await prisma.availabilitySlot.findFirst({
      where: {
        id: slotId,
        vendorId,
      },
    })

    if (!slot) {
      return NextResponse.json(
        { error: "Slot not found" },
        { status: 404 }
      )
    }

    if (slot.status !== "OPEN") {
      return NextResponse.json(
        { error: "Only OPEN slots can be closed. This date is already booked or locked." },
        { status: 400 }
      )
    }

    await prisma.availabilitySlot.update({
      where: { id: slotId },
      data: { status: "CLOSED" },
    })

    return NextResponse.json({ message: "Date closed successfully" })
  } catch (error) {
    console.error("Error closing date:", error)
    return NextResponse.json(
      { error: "Failed to close date" },
      { status: 500 }
    )
  }
}
