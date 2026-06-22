import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { QuotePayButton } from "@/components/booking/QuotePayButton"
import { CheckCircle2, Clock, XCircle, MapPin } from "lucide-react"

export const dynamic = "force-dynamic"

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "full" }).format(date)
}
function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`
}

export default async function QuoteReviewPage({ params }: { params: { id: string } }) {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: params.id },
    include: {
      service: { select: { name: true, description: true } },
      vendor: { select: { name: true, slug: true, profilePhoto: true, location: true } },
    },
  })

  if (!quote) notFound()

  const isExpired = quote.expiresAt && new Date() > quote.expiresAt
  const depositAmount = quote.quotedPrice && quote.depositPercentage
    ? Math.floor((quote.quotedPrice * quote.depositPercentage) / 100)
    : 0

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Vendor Header */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border-2 border-primary/20">
            {quote.vendor.profilePhoto ? (
              <img src={quote.vendor.profilePhoto} alt={quote.vendor.name || ""} className="h-full w-full object-cover" />
            ) : (
              <span className="text-primary text-xl font-bold">{quote.vendor.name?.charAt(0) || "V"}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Quote from</p>
            <h1 className="text-xl font-bold text-foreground">{quote.vendor.name}</h1>
            {quote.vendor.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{quote.vendor.location}
              </p>
            )}
          </div>
        </div>

        {/* Status-aware content */}
        {quote.status === "PENDING" && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-3">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-bold">Quote Pending Review</h2>
            <p className="text-sm text-muted-foreground">The vendor is reviewing your request. You&apos;ll receive an email once they send you a quote.</p>
          </div>
        )}

        {quote.status === "REJECTED" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-lg font-bold">Quote Request Declined</h2>
            <p className="text-sm text-muted-foreground">Unfortunately the vendor is unable to accommodate this request. Please reach out to them directly for more information.</p>
          </div>
        )}

        {quote.status === "ACCEPTED" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h2 className="text-lg font-bold text-emerald-800">Booking Confirmed!</h2>
            <p className="text-sm text-emerald-700">Your deposit has been paid and this booking is confirmed.</p>
          </div>
        )}

        {(quote.status === "EXPIRED" || (quote.status === "QUOTED" && isExpired)) && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-3">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
            <h2 className="text-lg font-bold">Quote Expired</h2>
            <p className="text-sm text-muted-foreground">This quote has expired. Please visit the vendor&apos;s profile to submit a new request.</p>
          </div>
        )}

        {quote.status === "QUOTED" && !isExpired && quote.quotedPrice && quote.depositPercentage && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            {/* Quote details */}
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Your Quote</h2>
                <span className="text-xs font-medium bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full">
                  {quote.expiresAt ? `Expires ${formatDate(quote.expiresAt)}` : ""}
                </span>
              </div>

              {/* Vendor message */}
              {quote.vendorMessage && (
                <div className="bg-secondary/5 border-l-4 border-secondary p-4 rounded-r-xl">
                  <p className="text-sm italic text-foreground">&quot;{quote.vendorMessage}&quot;</p>
                  <p className="text-xs text-muted-foreground mt-2">&mdash; {quote.vendor.name}</p>
                </div>
              )}

              {/* Summary rows */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{quote.service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Date</span>
                  <span className="font-medium">{formatDate(quote.requestedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quoted Price</span>
                  <span className="font-medium">{formatNaira(quote.quotedPrice)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-3">
                  <span className="text-muted-foreground">Deposit Required ({quote.depositPercentage}%)</span>
                  <span className="font-medium">{formatNaira(depositAmount)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-base border-t border-border pt-3">
                  <span>Total Due Now</span>
                  <span className="text-primary text-xl">{formatNaira(depositAmount)}</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-border bg-muted/20 p-6 space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Paying the deposit confirms your booking and locks in this date.
              </div>
              <QuotePayButton quoteId={quote.id} depositAmount={depositAmount} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
