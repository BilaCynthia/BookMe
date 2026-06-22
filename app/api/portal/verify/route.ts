import { NextRequest, NextResponse } from "next/server"
import { decode, encode } from "next-auth/jwt"
import { logger } from "@/lib/logger"

/**
 * GET /api/portal/verify
 * Verifies the magic link token and issues a session cookie.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/portal/login?error=MissingToken", req.url))
    }

    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) throw new Error("NEXTAUTH_SECRET is not configured")

    const decoded = await decode({ token, secret, salt: "bookme_client_portal_auth" })

    if (!decoded || !decoded.email || decoded.type !== "client_portal") {
      return NextResponse.redirect(new URL("/portal/login?error=InvalidToken", req.url))
    }

    // Token is valid. Issue a longer-lived session token (e.g., 30 days)
    const sessionToken = await encode({
      token: { email: decoded.email, type: "client_session" },
      secret,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      salt: "bookme_client_portal_session",
    })

    const response = NextResponse.redirect(new URL("/portal", req.url))
    
    response.cookies.set("client_portal_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    logger.error("api.portal.verify.failed", error as Error)
    return NextResponse.redirect(new URL("/portal/login?error=VerificationFailed", req.url))
  }
}
