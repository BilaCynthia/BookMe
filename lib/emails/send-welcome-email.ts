import { resend } from "@/lib/resend"
import { logger } from "@/lib/logger"

interface WelcomeEmailData {
  name: string
  email: string
  slug: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  if (!resend) {
    logger.warn("email.send.skipped", { reason: "RESEND_API_KEY not configured" })
    return
  }

  const profileLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${data.slug}`

  try {
    await resend.emails.send({
      from: "BookMe <hello@mietimi.online>",
      to: data.email,
      subject: `Welcome to BookMe, ${data.name}! 🎉`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a5c40;">BookMe</h1>
          </div>
          <h2>Welcome to BookMe, ${data.name}! 🎉</h2>
          <p>We're thrilled to have you join us.</p>
          <p>BookMe helps event vendors like you streamline your bookings and accept deposits effortlessly.</p>
          <p>Your unique BookMe profile link is ready! Share this link with your clients so they can view your services and book your available dates:</p>
          <br/>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
            <a href="${profileLink}" style="font-weight: bold; color: #1a5c40; text-decoration: none; word-break: break-all;">
              ${profileLink}
            </a>
          </div>
          <br/>
          <p><strong>Next steps to get started:</strong></p>
          <ol>
            <li style="margin-bottom: 8px;"><strong>Complete your profile:</strong> Add your profile picture, bio, and social links.</li>
            <li style="margin-bottom: 8px;"><strong>Add your services:</strong> Set your pricing and deposit rules.</li>
            <li style="margin-bottom: 8px;"><strong>Open your calendar:</strong> Select the dates you are available to work.</li>
          </ol>
          <p>If you have any questions, simply reply to this email.</p>
          <p>Best regards,<br/>The BookMe Team</p>
        </div>
      `,
    })
    logger.info("email.welcome.sent", { email: data.email })
  } catch (error) {
    logger.error("email.welcome.failed", error as Error, { email: data.email })
  }
}
