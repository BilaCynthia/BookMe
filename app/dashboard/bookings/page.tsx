import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { BookingStatusBadge } from "@/components/ui/Badge"
import { format } from "date-fns"

export const metadata = {
  title: "Bookings - BookMe",
}

type Booking = NonNullable<Awaited<ReturnType<typeof prisma.booking.findFirst>>>

type BookingWithService = Booking & {
  service: {
    name: string
  } | null
}

export default async function BookingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const vendorId = session.user.id as string

  const bookings = (await prisma.booking.findMany({
    where: {
      vendorId,
    },
    include: {
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      eventDate: "desc",
    },
  })) as BookingWithService[]

  const formatNgn = (kobo: number | null | undefined) => {
    const val = kobo ?? 0
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(val / 100)
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Bookings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            A detailed list of all your historical and upcoming bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
              <h3 className="mt-4 text-lg font-semibold">No bookings yet</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                You don&apos;t have any bookings. Share your link to start getting booked!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">Date</th>
                    <th scope="col" className="px-6 py-3 font-medium">Client</th>
                    <th scope="col" className="px-6 py-3 font-medium">Service</th>
                    <th scope="col" className="px-6 py-3 font-medium">Status</th>
                    <th scope="col" className="px-6 py-3 font-medium text-right">Deposit</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings?.map((booking: BookingWithService) => (
                    <tr key={booking.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {booking.eventDate ? format(new Date(booking.eventDate), "MMM d, yyyy") : "No Date"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{booking.clientName || "Unknown Client"}</div>
                        <div className="text-xs text-muted-foreground">{booking.clientEmail || "No Email"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground">{booking.service?.name || "Unknown Service"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <BookingStatusBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatNgn(booking.depositAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
