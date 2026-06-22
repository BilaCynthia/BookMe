import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { ReviewForm } from "@/components/booking/ReviewForm"

export const metadata = {
  title: "Leave a Review - BookMe",
}

interface PageProps {
  params: Promise<{ reference: string }>
}

export default async function ReviewPage({ params }: PageProps) {
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-primary/5 pattern-dots pointer-events-none" />

      <div className="w-full max-w-lg bg-surface/80 backdrop-blur-2xl border border-border/40 rounded-[2rem] shadow-2xl p-8 relative overflow-hidden z-10">
        
        {booking.rating !== null ? (
          <div className="text-center space-y-4 py-8">
            <div className="text-5xl">🎉</div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Review Submitted!</h2>
            <p className="text-subtle">
              Thank you for taking the time to review {booking.vendor.name}. Your feedback helps them grow.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              {booking.vendor.profilePhoto && (
                <img 
                  src={booking.vendor.profilePhoto} 
                  alt={booking.vendor.name || "Vendor"} 
                  className="w-20 h-20 rounded-full mx-auto object-cover shadow-md"
                />
              )}
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Rate your experience</h1>
                <p className="text-subtle text-sm mt-1">
                  How was your <strong>{booking.service.name}</strong> event with {booking.vendor.name}?
                </p>
              </div>
            </div>

            <ReviewForm bookingId={booking.id} />
          </div>
        )}
      </div>
    </div>
  )
}
