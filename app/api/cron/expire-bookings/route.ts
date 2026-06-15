import { NextResponse } from "next/server"
import { expireStaleBookings } from "@/lib/booking/expire-bookings"
import { logger } from "@/lib/logger"

// Vercel cron job handler
export async function GET(request: Request) {
  // Protect cron route (assuming Vercel CRON_SECRET is set)
  const authHeader = request.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const count = await expireStaleBookings()
    return NextResponse.json({ success: true, count }, { status: 200 })
  } catch (error) {
    logger.error("cron.expire.failed", error as Error)
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to run cron job." },
      { status: 500 }
    )
  }
}
