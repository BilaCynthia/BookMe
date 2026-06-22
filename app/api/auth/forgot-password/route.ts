import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/emails/send-password-reset"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const vendor = await prisma.vendor.findUnique({
      where: { email },
    })

    // To prevent email enumeration, we always return success even if vendor doesn't exist
    if (!vendor) {
      return NextResponse.json({ success: true })
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex")
    
    // Expires in 1 hour
    const expires = new Date(Date.now() + 3600000)

    // Save token to database
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    // Send email
    await sendPasswordResetEmail({
      email: vendor.email,
      name: vendor.name || "Vendor",
      resetToken: token,
    }).catch(console.error)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
