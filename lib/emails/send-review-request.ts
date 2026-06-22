import { resend } from "@/lib/resend"
import { logger } from "@/lib/logger"

interface SendReviewRequestParams {
  clientName: string
  clientEmail: string
  vendorName: string
  serviceName: string
  eventDate: Date
  reviewLink: string
}

export async function sendReviewRequest(params: SendReviewRequestParams) {
  if (!process.env.RESEND_API_KEY) {
    logger.warn("email.review_request.skipped", { reason: "No RESEND_API_KEY" })
    return
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background-color: #f5f0e6; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0; border: 1px solid #eaeaea; border-bottom: none;">
        <h1 style="color: #1a4231; margin: 0; font-size: 24px;">How was your event?</h1>
        <p style="margin-top: 8px; color: #666666;">We hope you had a fantastic time!</p>
      </div>
      
      <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #eaeaea; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; line-height: 1.5; margin-top: 0;">Hi ${params.clientName},</p>
        
        <p style="font-size: 16px; line-height: 1.5;">
          Your event with <strong>${params.vendorName}</strong> recently wrapped up. We'd love to hear how the <strong>${params.serviceName}</strong> service went!
        </p>

        <p style="font-size: 16px; line-height: 1.5;">
          Taking 60 seconds to leave a review helps ${params.vendorName} grow their business and helps other clients make great choices.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${params.reviewLink}" style="background-color: #1a4231; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Leave a Review</a>
        </div>

        <p style="font-size: 14px; color: #666666; margin-top: 32px; text-align: center;">
          Thank you for using BookMe!
        </p>
      </div>
    </div>
  `

  try {
    await resend!.emails.send({
      from: "BookMe <no-reply@mietimi.online>",
      to: params.clientEmail,
      subject: `How was your event with ${params.vendorName}?`,
      html,
    })
    logger.info("email.review_request.sent", { to: params.clientEmail })
  } catch (error) {
    logger.error("email.review_request.error", error as Error)
    throw error
  }
}
