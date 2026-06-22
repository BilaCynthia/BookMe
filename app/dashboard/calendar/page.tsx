import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { format, startOfToday } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { CalendarActions, EmptyCalendarAction } from "@/components/dashboard/CalendarActions"

export const metadata = {
  title: "Calendar - BookMe",
}

export default async function CalendarPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const vendorId = session.user.id
  const today = startOfToday()

  // Fetch slots from today onwards
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      vendorId,
      date: {
        gte: today,
      },
    },
    orderBy: {
      date: "asc",
    },
  })

  // Fetch all active bookings from today onwards
  const activeBookings = await prisma.booking.findMany({
    where: {
      vendorId,
      eventDate: {
        gte: today,
      },
      status: { in: ["PENDING", "CONFIRMED"] }
    },
    orderBy: {
      createdAt: "asc"
    }
  })

  // Group bookings by date string (YYYY-MM-DD)
  const bookingsByDate: Record<string, typeof activeBookings> = {}
  activeBookings.forEach(booking => {
    // Only include pending bookings if they are not expired
    if (booking.status === "PENDING" && new Date(booking.expiresAt) < new Date()) return;
    
    const dateStr = format(booking.eventDate, "yyyy-MM-dd")
    if (!bookingsByDate[dateStr]) bookingsByDate[dateStr] = []
    bookingsByDate[dateStr].push(booking)
  })

  // Pass existing open dates to the modal so it can grey them out
  const existingDates = slots.map((s) => s.date.toISOString())

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Calendar</h2>
        <CalendarActions existingDates={existingDates} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Schedule</CardTitle>
          <CardDescription>
            Your open dates and confirmed bookings for the future.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
             <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center bg-muted/10">
               <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
               <h3 className="mt-4 text-lg font-semibold">Your calendar is empty</h3>
               <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                 You haven&apos;t opened any dates yet. Open dates so clients can start booking you.
               </p>
               <EmptyCalendarAction existingDates={existingDates} />
             </div>
          ) : (
            <div className="space-y-4">
              {slots.map((slot) => {
                const isBooked = slot.status === "BLOCKED" || slot.status === "PENDING_LOCK"
                const dateStr = format(slot.date, "yyyy-MM-dd")
                const slotBookings = bookingsByDate[dateStr] || []
                
                return (
                  <div 
                    key={slot.id} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4 transition-colors ${
                      isBooked ? "bg-muted/30 border-primary/20" : "bg-card hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start space-x-4 mb-4 sm:mb-0">
                      <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-md mt-1 ${
                        isBooked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        <span className="text-xs font-semibold uppercase">{format(slot.date, "MMM")}</span>
                        <span className="text-xl font-bold leading-none">{format(slot.date, "dd")}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium pt-1">
                          {format(slot.date, "EEEE, MMMM do, yyyy")}
                        </p>
                        
                        {slotBookings.length > 0 && (
                          <div className="flex flex-col gap-1.5 mt-1">
                            {slotBookings.map((booking, idx) => (
                              <div key={booking.id} className="flex items-center text-sm text-muted-foreground bg-background rounded p-1.5 px-2 border">
                                <span className="font-semibold text-foreground mr-1 truncate max-w-[120px]">{booking.clientName}</span>
                                <span className="truncate max-w-[150px] mr-2">— {booking.eventDescription || "Standard Booking"}</span>
                                {booking.status === "PENDING" ? (
                                  <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 ml-auto shrink-0 bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 ml-auto shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">Confirmed</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto h-full sm:self-start sm:mt-2">
                      {slot.status === "OPEN" && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-600/30 bg-emerald-50">
                          Available
                        </Badge>
                      )}
                      {slot.status === "BLOCKED" && (
                        <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                          Fully Booked
                        </Badge>
                      )}
                      {slot.status === "PENDING_LOCK" && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-amber-500 animate-pulse" />
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">
                            Pending Payment
                          </Badge>
                        </div>
                      )}
                      {slot.status === "CLOSED" && (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          Closed
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
