import { prisma } from "@/lib/db"
import { startOfDay, addMonths, format } from "date-fns"

export async function getAvailableDates(vendorId: string): Promise<{
  availableDates: string[]
  blockedDates: string[]
}> {
  const from = startOfDay(new Date())
  const to = addMonths(from, 3)

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      vendorId,
      date: { gte: from, lte: to },
      status: { in: ["OPEN", "BLOCKED"] },
    },
    select: { date: true, status: true },
    orderBy: { date: "asc" },
  })

  return {
    availableDates: slots
      .filter((s) => s.status === "OPEN")
      .map((s) => format(s.date, "yyyy-MM-dd")),
    blockedDates: slots
      .filter((s) => s.status === "BLOCKED")
      .map((s) => format(s.date, "yyyy-MM-dd")),
  }
}
