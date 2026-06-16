import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: { reference: string }
  searchParams: { status?: string; tx_ref?: string; transaction_id?: string }
}) {
  const booking = await prisma.booking.findUnique({
    where: { reference: params.reference },
    include: {
      vendor: true,
      service: true,
    },
  })

  if (!booking) {
    notFound()
  }

  let isConfirmed = booking.status === "CONFIRMED"
  
  // Attempt manual verification if the booking is pending and Flutterwave returned a transaction_id
  if (!isConfirmed && searchParams.transaction_id && searchParams.tx_ref === booking.txRef) {
    try {
      const { verifyFlutterwavePayment } = await import("@/lib/flutterwave/verify-payment")
      const { confirmBooking } = await import("@/lib/booking/confirm-booking")
      
      const verification = await verifyFlutterwavePayment(searchParams.transaction_id)
      
      if (verification.isValid && verification.amountNaira >= booking.depositAmount / 100) {
        // Create a manual sync record to satisfy the confirmBooking webhook dependency
        const syncEvent = await prisma.webhookEvent.create({
          data: {
            provider: "manual_sync",
            eventType: "charge.completed",
            payload: { transaction_id: searchParams.transaction_id, manual: true },
            txRef: booking.txRef,
          }
        })
        
        await confirmBooking(booking.txRef, String(verification.flutterwaveId), syncEvent.id)
        booking.status = "CONFIRMED"
        isConfirmed = true
      }
    } catch (err) {
      console.error("Manual verification fallback failed:", err)
    }
  }

  // If we're on localhost and it's still pending after verification attempt, alert developer
  const isLocalhostPending = !isConfirmed && process.env.NEXT_PUBLIC_APP_URL?.includes("localhost")

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-16 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center space-y-6">
        {isConfirmed ? (
          <>
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Booking Confirmed!</h1>
            <p className="text-muted-foreground text-lg max-w-lg">
              Your deposit has been verified. Your booking with {booking.vendor.name} is now locked in.
            </p>
          </>
        ) : (
          <>
            <div className="h-20 w-20 bg-secondary/10 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-secondary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Processing Payment...</h1>
            <p className="text-muted-foreground text-lg max-w-lg">
              We are waiting for Flutterwave to confirm your payment. This usually takes just a few moments.
            </p>
            
            {isLocalhostPending && (
              <div className="mt-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left max-w-xl w-full flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm text-amber-600 dark:text-amber-400">
                  <p className="font-semibold">Localhost Webhook Limitation</p>
                  <p>
                    Because you are running on <code>localhost</code>, Flutterwave cannot send the "payment successful" webhook to your computer. 
                  </p>
                  <p>
                    In a production environment, the webhook would arrive and automatically update this booking to <strong>CONFIRMED</strong>. To test this locally, you need to use a tool like <strong>ngrok</strong> to expose your localhost to the internet.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        <div className="w-full max-w-md bg-surface border rounded-2xl p-6 text-left mt-8 space-y-4 shadow-sm">
          <h2 className="font-semibold border-b pb-2">Booking Details</h2>
          
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="text-muted-foreground">Reference</div>
            <div className="font-medium text-right">{booking.reference}</div>
            
            <div className="text-muted-foreground">Service</div>
            <div className="font-medium text-right">{booking.service.name}</div>
            
            <div className="text-muted-foreground">Date</div>
            <div className="font-medium text-right">
              {new Date(booking.eventDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            <div className="text-muted-foreground">Deposit Paid</div>
            <div className="font-medium text-right">₦{(booking.depositAmount / 100).toLocaleString()}</div>

            <div className="text-muted-foreground">Status</div>
            <div className="text-right">
              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${isConfirmed ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                {booking.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
