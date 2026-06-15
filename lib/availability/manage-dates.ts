import { prisma } from "@/lib/db"

export async function openDates(vendorId: string, dates: Date[]): Promise<void> {
  // Use createMany with skipDuplicates for bulk open
  await prisma.availabilitySlot.createMany({
    data: dates.map((date) => ({
      vendorId,
      date,
      status: "OPEN" as const,
    })),
    skipDuplicates: true,
  })

  // Update CLOSED slots back to OPEN
  await prisma.availabilitySlot.updateMany({
    where: {
      vendorId,
      date: { in: dates },
      status: "CLOSED",
    },
    data: { status: "OPEN" },
  })
}

export async function closeDates(vendorId: string, dates: Date[]): Promise<void> {
  await prisma.availabilitySlot.updateMany({
    where: {
      vendorId,
      date: { in: dates },
      status: "OPEN", // Only close OPEN slots
    },
    data: { status: "CLOSED" },
  })
}
