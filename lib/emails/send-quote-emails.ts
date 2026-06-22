import { resend } from "@/lib/resend"
import { logger } from "@/lib/logger"

const FROM = "BookMe <hello@mietimi.online>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "full" }).format(date)
}
function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`
}

// ─── 1. Vendor receives new quote request ───────────────────────────────────

interface QuoteRequestVendorData {
  vendorName: string
  vendorEmail: string
  clientName: string
  clientEmail: string
  serviceName: string
  requestedDate: Date
  requirements: string
  guestCount?: number
  quoteId: string
}

export async function sendQuoteRequestReceivedVendor(data: QuoteRequestVendorData) {
  if (!resend) return

  const dashboardLink = `${APP_URL}/dashboard/quotes`

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: data.vendorEmail,
      subject: `New Quote Request: ${data.serviceName} from ${data.clientName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #1a5c40;">BookMe</h1>
          <h2>New Quote Request 📋</h2>
          <p>Hi ${data.vendorName},</p>
          <p>You have received a new quote request for <strong>${data.serviceName}</strong>.</p>
          <div style="background:#f3f4f6; padding:16px; border-radius:8px; margin: 16px 0;">
            <p style="margin:0 0 8px;"><strong>Client:</strong> ${data.clientName} (${data.clientEmail})</p>
            <p style="margin:0 0 8px;"><strong>Preferred Date:</strong> ${formatDate(data.requestedDate)}</p>
            ${data.guestCount ? `<p style="margin:0 0 8px;"><strong>Guest Count:</strong> ${data.guestCount}</p>` : ""}
            <p style="margin:0;"><strong>Requirements:</strong><br/>${data.requirements}</p>
          </div>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${dashboardLink}" style="background:#1a5c40; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold;">
              Review &amp; Send Quote
            </a>
          </div>
          <p style="font-size:12px; color:#666;">Log in to your BookMe dashboard to send a price quote to this client.</p>
        </div>
      `,
    })
    if (error) logger.error("email.quote.vendor.error", new Error(error.message))
    else logger.info("email.quote.vendor.sent", { quoteId: data.quoteId })
  } catch (err) {
    logger.error("email.quote.vendor.failed", err as Error)
  }
}

// ─── 2. Client receives acknowledgement ─────────────────────────────────────

interface QuoteAcknowledgementData {
  clientName: string
  clientEmail: string
  vendorName: string
  serviceName: string
  requestedDate: Date
}

export async function sendQuoteRequestAcknowledgement(data: QuoteAcknowledgementData) {
  if (!resend) return

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: data.clientEmail,
      subject: `Quote Request Received — ${data.serviceName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #1a5c40;">BookMe</h1>
          <h2>Quote Request Received ✅</h2>
          <p>Hi ${data.clientName},</p>
          <p>Your quote request for <strong>${data.serviceName}</strong> with <strong>${data.vendorName}</strong> has been received.</p>
          <div style="background:#f3f4f6; padding:16px; border-radius:8px; margin: 16px 0;">
            <p style="margin:0 0 8px;"><strong>Service:</strong> ${data.serviceName}</p>
            <p style="margin:0;"><strong>Preferred Date:</strong> ${formatDate(data.requestedDate)}</p>
          </div>
          <p>The vendor will review your request and send you a quote by email. You can pay the deposit directly from your quote email once it arrives.</p>
          <p>Best regards,<br/>The BookMe Team</p>
        </div>
      `,
    })
    if (error) logger.error("email.quote.ack.error", new Error(error.message))
  } catch (err) {
    logger.error("email.quote.ack.failed", err as Error)
  }
}

// ─── 3. Client receives the vendor's quote ──────────────────────────────────

interface QuoteToClientData {
  clientName: string
  clientEmail: string
  vendorName: string
  serviceName: string
  requestedDate: Date
  quotedPrice: number // kobo
  depositPercentage: number
  vendorMessage?: string
  quoteId: string
  expiresAt: Date
}

export async function sendQuoteToClient(data: QuoteToClientData) {
  if (!resend) return

  const depositAmount = Math.floor((data.quotedPrice * data.depositPercentage) / 100)
  const quoteLink = `${APP_URL}/quote/${data.quoteId}`

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: data.clientEmail,
      subject: `Your Quote from ${data.vendorName} — ${data.serviceName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #1a5c40;">BookMe</h1>
          <h2>Your Quote is Ready 🎉</h2>
          <p>Hi ${data.clientName},</p>
          <p><strong>${data.vendorName}</strong> has reviewed your request and sent you a quote for <strong>${data.serviceName}</strong>.</p>
          ${data.vendorMessage ? `<div style="background:#fff8e1; border-left: 4px solid #e6a817; padding: 12px 16px; margin: 16px 0; border-radius:4px;"><p style="margin:0; font-style:italic;">"${data.vendorMessage}"</p><p style="margin:8px 0 0; font-size:12px; color:#666;">— ${data.vendorName}</p></div>` : ""}
          <div style="background:#f3f4f6; padding:16px; border-radius:8px; margin: 16px 0;">
            <p style="margin:0 0 8px;"><strong>Service:</strong> ${data.serviceName}</p>
            <p style="margin:0 0 8px;"><strong>Event Date:</strong> ${formatDate(data.requestedDate)}</p>
            <p style="margin:0 0 8px;"><strong>Total Price:</strong> ${formatNaira(data.quotedPrice)}</p>
            <p style="margin:0 0 8px;"><strong>Deposit Required (${data.depositPercentage}%):</strong> ${formatNaira(depositAmount)}</p>
            <p style="margin:0; font-size:12px; color:#888;">Quote expires: ${formatDate(data.expiresAt)}</p>
          </div>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${quoteLink}" style="background:#1a5c40; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold;">
              Pay Deposit — ${formatNaira(depositAmount)}
            </a>
          </div>
          <p style="font-size:12px; color:#666;">Paying the deposit confirms your booking and blocks the date. This quote will expire on ${formatDate(data.expiresAt)}.</p>
        </div>
      `,
    })
    if (error) logger.error("email.quote.client.error", new Error(error.message))
    else logger.info("email.quote.client.sent", { quoteId: data.quoteId })
  } catch (err) {
    logger.error("email.quote.client.failed", err as Error)
  }
}

// ─── 4. Vendor notified when quote is accepted (booking confirmed) ───────────

interface QuoteAcceptedVendorData {
  vendorName: string
  vendorEmail: string
  clientName: string
  serviceName: string
  eventDate: Date
  depositAmount: number // kobo
  bookingReference: string
}

export async function sendQuoteAcceptedVendor(data: QuoteAcceptedVendorData) {
  if (!resend) return

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: data.vendorEmail,
      subject: `Quote Accepted & Booking Confirmed — ${data.serviceName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #1a5c40;">BookMe</h1>
          <h2>Quote Accepted! 🎉</h2>
          <p>Hi ${data.vendorName},</p>
          <p><strong>${data.clientName}</strong> has paid the deposit and confirmed their booking for <strong>${data.serviceName}</strong>.</p>
          <div style="background:#f3f4f6; padding:16px; border-radius:8px; margin: 16px 0;">
            <p style="margin:0 0 8px;"><strong>Client:</strong> ${data.clientName}</p>
            <p style="margin:0 0 8px;"><strong>Event Date:</strong> ${formatDate(data.eventDate)}</p>
            <p style="margin:0 0 8px;"><strong>Deposit Received:</strong> ${formatNaira(data.depositAmount)}</p>
            <p style="margin:0;"><strong>Reference:</strong> ${data.bookingReference}</p>
          </div>
          <p>The date is now blocked on your calendar. Log in to your BookMe dashboard to view the full details.</p>
        </div>
      `,
    })
    if (error) logger.error("email.quote.accepted.vendor.error", new Error(error.message))
  } catch (err) {
    logger.error("email.quote.accepted.vendor.failed", err as Error)
  }
}
