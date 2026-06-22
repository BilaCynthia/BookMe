import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { BalanceCheckoutForm } from "@/components/booking/BalanceCheckoutForm"

export const metadata = {
  title: "Pay Balance - BookMe",
}

interface PageProps {
  params: Promise<{ reference: string }>
}

export default async function BalancePaymentPage({ params }: PageProps) {
  const { reference } = await params

  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: {
      vendor: { select: { name: true, profilePhoto: true } },
      service: { select: { name: true } },
    },
  })

  if (!booking) {
    notFound()
  }

  const balanceAmountKobo = booking.basePrice - booking.depositAmount

  const formatNgn = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(kobo / 100)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary/20">
      <div className="w-full max-w-md bg-surface/80 backdrop-blur-2xl border border-border/40 rounded-[2rem] shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-50 pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-heading text-2xl font-bold text-foreground">Final Invoice</h1>
            <p className="text-subtle text-sm">Complete your payment for {booking.vendor.name}</p>
          </div>

          <div className="bg-background/50 rounded-2xl p-6 border border-border/30 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-subtle">Service</span>
              <span className="font-medium text-foreground">{booking.service.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-subtle">Event Date</span>
              <span className="font-medium text-foreground">
                {booking.eventDate.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="h-px w-full bg-border/40" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-subtle">Total Price</span>
              <span className="font-medium text-foreground">{formatNgn(booking.basePrice)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-subtle">Deposit Paid</span>
              <span className="font-medium text-foreground line-through opacity-70">
                {formatNgn(booking.depositAmount)}
              </span>
            </div>
            <div className="h-px w-full bg-border/40" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Balance Due</span>
              <span className="font-heading text-2xl font-bold text-primary">
                {formatNgn(balanceAmountKobo)}
              </span>
            </div>
          </div>

          {booking.balancePaid ? (
            <div className="bg-primary/10 text-primary p-4 rounded-xl text-center font-semibold border border-primary/20">
              This balance has already been paid!
            </div>
          ) : balanceAmountKobo <= 0 ? (
            <div className="bg-secondary/10 text-secondary-foreground p-4 rounded-xl text-center font-semibold border border-secondary/20">
              No outstanding balance.
            </div>
          ) : (
            <BalanceCheckoutForm bookingId={booking.id} />
          )}
        </div>
      </div>
    </div>
  )
}
