import { resend } from "@/lib/resend"
import { logger } from "@/lib/logger"

interface BookingConfirmationData {
  reference: string
  clientName: string
  clientEmail: string
  vendorName: string
  vendorEmail: string
  serviceName: string
  eventDate: Date
  depositAmountNaira: number
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
  }).format(date)
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  if (!resend) {
    logger.warn("email.send.skipped", { reason: "RESEND_API_KEY not configured" })
    return
  }

  const dateString = formatDate(data.eventDate)

  // 1. Send Email to Client
  try {
    await resend.emails.send({
      from: "BookMe <hello@bookme.com>", // You should use your verified domain here
      to: data.clientEmail,
      subject: `Booking Confirmed: ${data.serviceName} with ${data.vendorName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Booking Confirmed! 🎉</h2>
          <p>Hi ${data.clientName},</p>
          <p>Your deposit of <strong>₦${data.depositAmountNaira.toLocaleString()}</strong> has been successfully processed.</p>
          <p>Your booking with <strong>${data.vendorName}</strong> for <strong>${data.serviceName}</strong> is now confirmed for <strong>${dateString}</strong>.</p>
          <br/>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px;">
            <p style="margin: 0;"><strong>Booking Reference:</strong> ${data.reference}</p>
          </div>
          <br/>
          <p>The vendor will contact you shortly with next steps.</p>
          <p>Thank you for using BookMe!</p>
        </div>
      `,
    })
  } catch (error) {
    logger.error("email.send.client.failed", error as Error, { reference: data.reference })
  }

  // 2. Send Email to Vendor
  try {
    await resend.emails.send({
      from: "BookMe <hello@bookme.com>",
      to: data.vendorEmail,
      subject: `New Booking: ${data.serviceName} on ${dateString}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Booking! 🎉</h2>
          <p>Hi ${data.vendorName},</p>
          <p>You have a new confirmed booking from <strong>${data.clientName}</strong>.</p>
          <p>They have paid the deposit of <strong>₦${data.depositAmountNaira.toLocaleString()}</strong> for <strong>${data.serviceName}</strong>.</p>
          <br/>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px;">
            <p style="margin: 0;"><strong>Event Date:</strong> ${dateString}</p>
            <p style="margin: 8px 0 0 0;"><strong>Client Email:</strong> ${data.clientEmail}</p>
            <p style="margin: 8px 0 0 0;"><strong>Reference:</strong> ${data.reference}</p>
          </div>
          <br/>
          <p>Please log in to your BookMe dashboard to view the full details.</p>
        </div>
      `,
    })
  } catch (error) {
    logger.error("email.send.vendor.failed", error as Error, { reference: data.reference })
  }
}
