import { resend } from "@/lib/resend"
import { logger } from "@/lib/logger"

interface SendBalanceReminderParams {
  clientName: string
  clientEmail: string
  vendorName: string
  serviceName: string
  eventDate: Date
  balanceAmountNaira: number
  paymentLink: string
}

export async function sendBalanceReminder(params: SendBalanceReminderParams) {
  if (!process.env.RESEND_API_KEY) {
    logger.warn("email.balance_reminder.skipped", { reason: "No RESEND_API_KEY" })
    return
  }

  const formattedDate = params.eventDate.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(params.balanceAmountNaira)

  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background-color: #1a4231; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Action Required: Balance Due</h1>
      </div>
      
      <div style="padding: 32px 24px; background-color: #fcfcfc; border: 1px solid #eaeaea; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; line-height: 1.5; margin-top: 0;">Hi ${params.clientName},</p>
        
        <p style="font-size: 16px; line-height: 1.5;">
          Your event with <strong>${params.vendorName}</strong> is coming up on <strong>${formattedDate}</strong>!
        </p>

        <p style="font-size: 16px; line-height: 1.5;">
          This is a friendly reminder that the final balance for your <strong>${params.serviceName}</strong> booking is now due.
        </p>

        <div style="background-color: #f5f0e6; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #4a4a4a; text-transform: uppercase; letter-spacing: 1px;">Amount Due</p>
          <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #1a4231;">${formattedAmount}</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${params.paymentLink}" style="background-color: #1a4231; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Pay Balance Now</a>
        </div>

        <p style="font-size: 14px; color: #666666; margin-top: 32px; text-align: center;">
          If you have any questions, please reply directly to this email to contact ${params.vendorName}.
        </p>
      </div>
    </div>
  `

  try {
    await resend!.emails.send({
      from: "BookMe <no-reply@mietimi.online>",
      replyTo: "support@mietimi.online", // Vendor's email should ideally be here
      to: params.clientEmail,
      subject: `Final Balance Due: ${params.vendorName}`,
      html,
    })
    logger.info("email.balance_reminder.sent", { to: params.clientEmail })
  } catch (error) {
    logger.error("email.balance_reminder.error", error as Error)
    throw error
  }
}
