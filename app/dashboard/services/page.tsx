import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ServiceManager } from "@/components/dashboard/ServiceManager"

export const metadata = {
  title: "Services - BookMe",
  description: "Manage your services and pricing",
}

export default async function ServicesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const vendorId = session.user.id

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true },
  })

  if (!vendor) redirect("/login")

  // Fetch all services (including inactive) for the dashboard view
  const services = await prisma.service.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
  })

  // Serialize dates for the client component
  const serializedServices = services.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return (
    <div className="flex-1 p-8 pt-6 max-w-5xl">
      <ServiceManager initialServices={serializedServices} />
    </div>
  )
}
