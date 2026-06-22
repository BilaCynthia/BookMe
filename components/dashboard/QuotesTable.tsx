"use client"

import * as React from "react"
import { format } from "date-fns"
import { MessageSquare, Send, XCircle, Clock, CheckCircle2, ChevronDown, ChevronUp, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

interface QuoteWithService {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string
  requestedDate: Date
  requirements: string
  guestCount?: number | null
  eventType?: string | null
  quotedPrice?: number | null
  depositPercentage?: number | null
  vendorMessage?: string | null
  quotedAt?: Date | null
  expiresAt?: Date | null
  status: string
  createdAt: Date
  service: { id: string; name: string }
}

interface QuotesTableProps {
  quotes: QuoteWithService[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  QUOTED: { label: "Quoted", color: "bg-blue-100 text-blue-800" },
  ACCEPTED: { label: "Accepted", color: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
  EXPIRED: { label: "Expired", color: "bg-muted text-muted-foreground" },
}

function SendQuoteModal({ quoteId, onSuccess }: { quoteId: string; onSuccess: () => void }) {
  const [price, setPrice] = React.useState("")
  const [deposit, setDeposit] = React.useState("30")
  const [message, setMessage] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSend = async () => {
    if (!price || isNaN(parseFloat(price))) {
      setError("Please enter a valid price.")
      return
    }
    setIsSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          quotedPrice: parseFloat(price),
          depositPercentage: parseInt(deposit, 10),
          vendorMessage: message || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to send quote")
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-4 border border-border rounded-xl p-4 space-y-4 bg-muted/20">
      <h4 className="font-semibold text-sm text-foreground">Send Quote</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Your Price (₦) *</label>
          <Input
            type="number"
            min="1000"
            placeholder="e.g. 150000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Deposit % *</label>
          <Input
            type="number"
            min="10"
            max="100"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Message to Client (Optional)</label>
        <textarea
          className="flex min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none"
          placeholder="e.g. This price includes setup and teardown..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSend} disabled={isSubmitting} isLoading={isSubmitting} className="flex-1">
          <Send className="mr-2 h-4 w-4" /> Send Quote
        </Button>
      </div>
      {price && deposit && (
        <p className="text-xs text-muted-foreground">
          Client will be asked to pay{" "}
          <strong>₦{Math.floor((parseFloat(price) * parseInt(deposit, 10)) / 100).toLocaleString()}</strong>{" "}
          ({deposit}% deposit) to confirm the booking.
        </p>
      )}
    </div>
  )
}

function QuoteRow({ quote, onRefresh }: { quote: QuoteWithService; onRefresh: () => void }) {
  const [expanded, setExpanded] = React.useState(false)
  const [showSendModal, setShowSendModal] = React.useState(false)
  const [isRejecting, setIsRejecting] = React.useState(false)
  const [localStatus, setLocalStatus] = React.useState(quote.status)

  const cfg = statusConfig[localStatus] ?? statusConfig.PENDING

  const handleReject = async () => {
    if (!confirm("Are you sure you want to decline this quote request?")) return
    setIsRejecting(true)
    try {
      await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      })
      setLocalStatus("REJECTED")
      onRefresh()
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="border border-border rounded-2xl bg-background overflow-hidden">
      {/* Row Header */}
      <div className="flex items-center gap-4 p-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary font-bold text-sm">{quote.clientName.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{quote.clientName}</p>
          <p className="text-xs text-muted-foreground truncate">{quote.service.name} · {format(new Date(quote.requestedDate), "dd MMM yyyy")}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
          {cfg.label}
        </span>
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground transition-colors">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /><span>{quote.clientEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" /><span>{quote.clientPhone}</span>
            </div>
            {quote.eventType && (
              <div><span className="text-xs text-muted-foreground">Event Type: </span><span className="font-medium">{quote.eventType}</span></div>
            )}
            {quote.guestCount && (
              <div><span className="text-xs text-muted-foreground">Guest Count: </span><span className="font-medium">{quote.guestCount}</span></div>
            )}
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Requirements</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{quote.requirements}</p>
          </div>

          {localStatus === "QUOTED" && quote.quotedPrice && quote.depositPercentage && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
              <p className="text-xs text-blue-600 font-medium mb-1">Quote Sent</p>
              <p>Price: <strong>₦{(quote.quotedPrice / 100).toLocaleString()}</strong> · Deposit: <strong>{quote.depositPercentage}%</strong></p>
              {quote.expiresAt && <p className="text-xs text-muted-foreground mt-1">Expires: {format(new Date(quote.expiresAt), "dd MMM yyyy")}</p>}
            </div>
          )}

          {localStatus === "PENDING" && (
            <div className="flex gap-2">
              <Button onClick={() => setShowSendModal(!showSendModal)} className="flex-1" variant={showSendModal ? "outline" : "default"}>
                <Send className="mr-2 h-4 w-4" />{showSendModal ? "Cancel" : "Send Quote"}
              </Button>
              <Button variant="outline" onClick={handleReject} disabled={isRejecting} className="text-destructive border-destructive/30 hover:bg-destructive/5">
                <XCircle className="mr-2 h-4 w-4" />Decline
              </Button>
            </div>
          )}

          {showSendModal && localStatus === "PENDING" && (
            <SendQuoteModal
              quoteId={quote.id}
              onSuccess={() => {
                setLocalStatus("QUOTED")
                setShowSendModal(false)
                onRefresh()
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function QuotesTable({ quotes: initialQuotes }: QuotesTableProps) {
  const [quotes, setQuotes] = React.useState(initialQuotes)

  if (quotes.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-border">
        <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-40" />
        <p className="text-muted-foreground font-medium">No quote requests yet.</p>
        <p className="text-sm text-muted-foreground mt-1">When clients request quotes for your services, they&apos;ll appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {quotes.map((q) => (
        <QuoteRow key={q.id} quote={q} onRefresh={() => window.location.reload()} />
      ))}
    </div>
  )
}
