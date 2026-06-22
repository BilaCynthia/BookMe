import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { EarningsAnalytics } from "@/components/dashboard/EarningsAnalytics"

export const metadata = {
  title: "Earnings - BookMe",
}

export default async function EarningsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const vendorId = session.user.id

  const bookings = await prisma.booking.findMany({
    where: {
      vendorId,
      status: "CONFIRMED",
    },
    orderBy: {
      eventDate: "asc",
    },
    select: {
      id: true,
      basePrice: true,
      depositAmount: true,
      createdAt: true,
      eventDate: true,
    }
  })

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div>
          <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Earnings</h2>
          <p className="text-sm text-subtle mt-1">Track your comprehensive revenue and deposit metrics.</p>
        </div>
      </div>
      
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-200">
        <EarningsAnalytics bookings={bookings} />
      </div>
    </div>
  )
}
