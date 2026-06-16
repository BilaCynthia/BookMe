import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { CalendarDays, CreditCard, DollarSign, Users } from "lucide-react"

export const metadata = {
  title: "Dashboard Overview - BookMe",
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const vendorId = session.user.id

  // Fetch all confirmed bookings
  const bookings = await prisma.booking.findMany({
    where: {
      vendorId,
      status: "CONFIRMED",
    },
    orderBy: {
      eventDate: "asc",
    },
  })

  // Calculate metrics
  const upcomingBookings = bookings.filter((b) => b.eventDate >= new Date())
  const totalBookings = bookings.length
  
  const totalRevenueKobo = bookings.reduce(
    (acc, booking) => acc + booking.basePrice,
    0
  )
  
  const totalDepositsKobo = bookings.reduce(
    (acc, booking) => acc + booking.depositAmount,
    0
  )

  const formatNgn = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(kobo / 100)
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Dashboard</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-surface/60 p-6 shadow-sm backdrop-blur-xl transition-all hover:border-primary/30 hover:shadow-md">
          <div className="flex flex-row items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-subtle">Total Revenue</h3>
            <div className="rounded-xl bg-primary/10 p-2 text-primary transition-transform group-hover:scale-110">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-heading text-3xl font-bold tracking-tight text-foreground">{formatNgn(totalRevenueKobo)}</div>
            <p className="text-xs text-subtle">Base price of confirmed events</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-surface/60 p-6 shadow-sm backdrop-blur-xl transition-all hover:border-secondary/30 hover:shadow-md">
          <div className="flex flex-row items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-subtle">Deposits Secured</h3>
            <div className="rounded-xl bg-secondary/20 p-2 text-secondary-foreground transition-transform group-hover:scale-110">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-heading text-3xl font-bold tracking-tight text-foreground">{formatNgn(totalDepositsKobo)}</div>
            <p className="text-xs text-subtle">Upfront payments collected</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-secondary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-surface/60 p-6 shadow-sm backdrop-blur-xl transition-all hover:border-tertiary/30 hover:shadow-md">
          <div className="flex flex-row items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-subtle">Upcoming Events</h3>
            <div className="rounded-xl bg-tertiary/20 p-2 text-tertiary-foreground transition-transform group-hover:scale-110">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-heading text-3xl font-bold tracking-tight text-foreground">+{upcomingBookings.length}</div>
            <p className="text-xs text-subtle">Scheduled for the future</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-tertiary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-surface/60 p-6 shadow-sm backdrop-blur-xl transition-all hover:border-muted-foreground/30 hover:shadow-md">
          <div className="flex flex-row items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-subtle">Total Clients</h3>
            <div className="rounded-xl bg-muted p-2 text-foreground transition-transform group-hover:scale-110">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-heading text-3xl font-bold tracking-tight text-foreground">+{totalBookings}</div>
            <p className="text-xs text-subtle">Across all historical bookings</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-muted-foreground/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7 animate-in fade-in slide-in-from-bottom-12 duration-700">
        <div className="lg:col-span-4 rounded-3xl border border-border/50 bg-surface/60 p-6 sm:p-8 shadow-sm backdrop-blur-xl">
          <div className="mb-6 space-y-1">
            <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">Recent Upcoming Events</h3>
            <p className="text-sm text-subtle">You have {upcomingBookings.length} upcoming confirmed bookings.</p>
          </div>
          
          <div>
            {upcomingBookings.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/50 text-sm text-subtle">
                No upcoming events found.
              </div>
            ) : (
              <div className="space-y-6">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl p-4 bg-background/50 border border-border/30 transition-colors hover:bg-muted/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {booking.clientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground leading-none">
                        {booking.clientName}
                      </p>
                      <p className="text-sm text-subtle">
                        {booking.clientEmail}
                      </p>
                    </div>
                    <div className="text-sm font-semibold bg-surface px-4 py-2 rounded-xl border border-border/40 shadow-sm whitespace-nowrap">
                      {booking.eventDate.toLocaleDateString("en-NG", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-3 rounded-3xl border border-border/50 bg-surface/60 p-6 sm:p-8 shadow-sm backdrop-blur-xl flex flex-col">
          <div className="mb-6 space-y-1">
            <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">Action Needed</h3>
            <p className="text-sm text-subtle">Tasks requiring your attention</p>
          </div>
          
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/50 p-8 text-center">
            <div className="max-w-[200px] space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <p className="text-sm text-subtle">Everything looks good! Your calendar is up to date.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
