import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { BookingWizard } from "@/components/booking/BookingWizard"

export const metadata = {
  title: "Book Service - BookMe",
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { service?: string }
}) {
  if (!searchParams.service) {
    redirect(`/${params.slug}`)
  }

  let vendor, service;
  try {
    const results = await Promise.all([
      prisma.vendor.findFirst({
        where: { slug: { equals: params.slug, mode: "insensitive" }, isActive: true },
      }),
      prisma.service.findUnique({
        where: { id: searchParams.service, isActive: true },
      }),
    ])
    vendor = results[0]
    service = results[1]
  } catch (error: any) {
    return <div className="p-10 text-red-500">DATABASE ERROR: {error.message}</div>
  }

  if (!vendor || !service || service.vendorId !== vendor.id) {
    notFound()
  }

  // Fetch only OPEN slots from today onwards
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const openSlots = await prisma.availabilitySlot.findMany({
    where: {
      vendorId: vendor.id,
      status: "OPEN",
      date: {
        gte: today,
      },
    },
    orderBy: {
      date: "asc",
    },
    select: {
      id: true,
      date: true,
    },
  })

  // We need to serialize the dates to ISO strings before passing to Client Component
  const serializedSlots = openSlots.map(slot => ({
    id: slot.id,
    date: slot.date.toISOString(),
  }))

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Complete your booking
          </h1>
          <p className="text-muted-foreground mt-2">
            You are booking <span className="font-semibold text-foreground">{service.name}</span> with <span className="font-semibold text-foreground">{vendor.name}</span>.
          </p>
        </div>

        <BookingWizard 
          vendor={{ id: vendor.id, name: vendor.name || "Vendor" }}
          service={{ 
            id: service.id, 
            name: service.name, 
            basePrice: service.basePrice, 
            depositPercentage: service.depositPercentage 
          }}
          availableSlots={serializedSlots}
        />
      </div>
    </div>
  )
}
