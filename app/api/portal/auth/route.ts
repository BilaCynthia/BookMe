import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { encode } from "next-auth/jwt"
import { prisma } from "@/lib/db"
import { resend } from "@/lib/resend"
import { logger } from "@/lib/logger"

const requestSchema = z.object({
  email: z.string().email(),
})

/**
 * POST /api/portal/auth
 * Generates a magic link for clients to access their bookings dashboard.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const { email } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    // Check if client has any bookings
    const bookingCount = await prisma.booking.count({
      where: { clientEmail: normalizedEmail },
    })

    if (bookingCount === 0) {
      // Return success anyway to prevent email enumeration, but don't send an email
      // Or, be transparent since this is a utility portal
      return NextResponse.json(
        { error: "No bookings found for this email address." },
        { status: 404 }
      )
    }

    // Generate stateless JWT magic link
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) throw new Error("NEXTAUTH_SECRET is not configured")

    const token = await encode({
      token: { email: normalizedEmail, type: "client_portal" },
      secret,
      maxAge: 15 * 60, // 15 minutes expiry for the login link
      salt: "bookme_client_portal_auth",
    })

    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/portal/verify?token=${token}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
        <h2>BookMe Client Portal</h2>
        <p>Click the button below to securely sign in to your BookMe dashboard to manage your bookings.</p>
        <p>This link will expire in 15 minutes.</p>
        <a href="${magicLink}" style="background-color: #1a4231; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
          Sign In to Dashboard
        </a>
      </div>
    `

    if (process.env.RESEND_API_KEY) {
      await resend!.emails.send({
        from: "BookMe <no-reply@mietimi.online>",
        to: normalizedEmail,
        subject: "Your BookMe Sign-In Link",
        html,
      })
    } else {
      logger.warn("email.portal_auth.skipped", { magicLink })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("api.portal.auth.failed", error as Error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
