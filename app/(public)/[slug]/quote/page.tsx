import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { QuoteRequestForm } from "@/components/booking/QuoteRequestForm"

export const revalidate = 60

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { service?: string }
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { slug: params.slug, isActive: true },
    select: { id: true, name: true, slug: true, profilePhoto: true, category: true },
  })

  if (!vendor) notFound()

  const serviceId = searchParams.service
  if (!serviceId) notFound()

  const service = await prisma.service.findUnique({
    where: { id: serviceId, vendorId: vendor.id, isActive: true, serviceType: "QUOTE_REQUIRED" },
    select: { id: true, name: true, description: true, depositPercentage: true },
  })

  if (!service) notFound()

  // Fetch available slots (open dates only — quote doesn't block dates)
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      vendorId: vendor.id,
      status: "OPEN",
      date: { gte: new Date() },
    },
    orderBy: { date: "asc" },
    select: { id: true, date: true },
  })

  const availableSlots = slots.map((s) => ({
    id: s.id,
    date: s.date.toISOString().split("T")[0],
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border-2 border-primary/20">
            {vendor.profilePhoto ? (
              <img src={vendor.profilePhoto} alt={vendor.name || "Vendor"} className="h-full w-full object-cover" />
            ) : (
              <span className="text-primary text-xl font-bold">{vendor.name?.charAt(0) || "V"}</span>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Request a quote from</p>
            <h1 className="text-xl font-bold text-foreground">{vendor.name}</h1>
          </div>
        </div>

        {/* Service info */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Service</p>
              <h2 className="font-bold text-lg text-foreground">{service.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full">
              Quote Required
            </span>
          </div>
        </div>

        {/* Quote form */}
        <QuoteRequestForm
          vendor={{ id: vendor.id, name: vendor.name || "Vendor" }}
          service={{ id: service.id, name: service.name }}
          availableSlots={availableSlots}
        />
      </div>
    </div>
  )
}
