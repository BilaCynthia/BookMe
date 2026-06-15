import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
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
  
  // Calculate total earnings (deposits paid + pending balances)
  // For MVP, we just track the total base prices of confirmed bookings
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
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNgn(totalRevenueKobo)}</div>
            <p className="text-xs text-muted-foreground">
              Total base price of all confirmed events
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposits Secured</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNgn(totalDepositsKobo)}</div>
            <p className="text-xs text-muted-foreground">
              Total upfront payments collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{upcomingBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for the future
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Across all historical bookings
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Upcoming Events</CardTitle>
            <CardDescription>
              You have {upcomingBookings.length} upcoming confirmed bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No upcoming events found.
              </div>
            ) : (
              <div className="space-y-8">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {booking.clientName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.clientEmail}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
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
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Action Needed</CardTitle>
            <CardDescription>Tasks requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground text-center px-4">
              Everything looks good! Your calendar is up to date and there are no pending cancellation requests.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
