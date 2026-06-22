import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { decode } from "next-auth/jwt"
import { prisma } from "@/lib/db"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Calendar, CreditCard, ChevronRight, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Dashboard - Client Portal",
}

export default async function ClientPortalDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get("client_portal_session")?.value

  if (!token) {
    redirect("/portal/login")
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured")

  let decoded
  try {
    decoded = await decode({ token, secret, salt: "bookme_client_portal_session" })
  } catch (err) {
    redirect("/portal/login")
  }

  if (!decoded || !decoded.email || decoded.type !== "client_session") {
    redirect("/portal/login")
  }

  const clientEmail = decoded.email

  const bookings = await prisma.booking.findMany({
    where: { clientEmail },
    include: {
      vendor: { select: { name: true, profilePhoto: true } },
      service: { select: { name: true } },
    },
    orderBy: { eventDate: "asc" },
  })

  const formatNgn = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(kobo / 100)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border/40 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="font-heading font-bold text-lg text-foreground">BookMe Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-subtle">{clientEmail}</span>
            <form action={async () => {
              "use server"
              const cookieStore = await cookies()
              cookieStore.delete("client_portal_session")
              redirect("/portal/login")
            }}>
              <button className="text-sm font-medium text-destructive hover:underline">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h2 className="text-3xl font-bold font-heading text-foreground">Your Bookings</h2>
          <p className="text-subtle mt-1">Manage your events and upcoming payments.</p>
        </div>

        {bookings.length === 0 ? (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No bookings found</h3>
              <p className="text-subtle mt-2">You don't have any bookings associated with this email address.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {bookings.map((booking) => {
              const isPast = new Date() > booking.eventDate
              const balanceKobo = booking.basePrice - booking.depositAmount
              const hasBalance = balanceKobo > 0 && !booking.balancePaid && booking.status === "CONFIRMED"

              return (
                <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-all border-border/50 group">
                  <div className="flex p-6 gap-5">
                    {booking.vendor.profilePhoto ? (
                      <img 
                        src={booking.vendor.profilePhoto} 
                        alt={booking.vendor.name || "Vendor"} 
                        className="w-16 h-16 rounded-full object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                        {booking.vendor.name?.charAt(0) || "V"}
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-foreground leading-tight">
                          {booking.service.name}
                        </h3>
                        {booking.status === "CONFIRMED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Confirmed
                          </span>
                        ) : booking.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium text-subtle">with {booking.vendor.name}</p>
                      
                      <div className="pt-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-subtle">
                          <Calendar className="w-4 h-4 opacity-70" />
                          <span>{format(booking.eventDate, "EEEE, MMMM do, yyyy")}</span>
                        </div>
                        
                        {hasBalance && (
                          <div className="flex items-center gap-2 text-secondary-foreground font-semibold bg-secondary/10 px-3 py-1.5 rounded-lg w-max mt-2">
                            <CreditCard className="w-4 h-4" />
                            Balance Due: {formatNgn(balanceKobo)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 border-t border-border/40 px-6 py-4 flex items-center justify-between group-hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium text-subtle">
                      Ref: <span className="font-mono text-foreground">{booking.reference}</span>
                    </span>
                    
                    {hasBalance ? (
                      <Link 
                        href={`/booking/${booking.reference}/balance`}
                        className="text-sm font-bold text-primary flex items-center hover:underline"
                      >
                        Pay Balance <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    ) : (
                      <Link 
                        href={`/booking/${booking.reference}/confirmation`}
                        className="text-sm font-bold text-foreground flex items-center hover:underline"
                      >
                        View Details <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
