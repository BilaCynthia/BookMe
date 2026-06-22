import { resend } from "@/lib/resend"
import { logger } from "@/lib/logger"

interface PasswordResetEmailData {
  email: string
  name: string
  resetToken: string
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  if (!resend) {
    logger.warn("email.send.skipped", { reason: "RESEND_API_KEY not configured" })
    return
  }

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${data.resetToken}`

  try {
    const { error } = await resend.emails.send({
      from: "BookMe <hello@mietimi.online>",
      to: data.email,
      subject: "Reset your BookMe password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a5c40;">BookMe</h1>
          </div>
          <h2>Password Reset Request</h2>
          <p>Hi ${data.name || "Vendor"},</p>
          <p>We received a request to reset your password for your BookMe account.</p>
          <p>Click the link below to securely reset your password. This link will expire in 1 hour.</p>
          <br/>
          <div style="text-align: center;">
            <a href="${resetLink}" style="display: inline-block; background-color: #1a5c40; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <br/>
          <p style="font-size: 14px; color: #666;">If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 14px; color: #666; word-break: break-all;">${resetLink}</p>
          <br/>
          <p style="font-size: 14px; color: #666;">If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Best regards,<br/>The BookMe Team</p>
        </div>
      `,
    })

    if (error) {
      logger.error("email.password_reset.api_error", new Error(error.message), { email: data.email })
      return
    }

    logger.info("email.password_reset.sent", { email: data.email })
  } catch (error) {
    logger.error("email.password_reset.failed", error as Error, { email: data.email })
  }
}
