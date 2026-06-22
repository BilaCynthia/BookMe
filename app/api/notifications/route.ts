import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    const notifications = await prisma.notification.findMany({
      where: {
        vendorId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: { vendorId: session.user.id, isRead: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

const patchSchema = z.object({
  action: z.enum(["markAsRead", "markAllAsRead"]),
  notificationId: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    if (parsed.data.action === "markAllAsRead") {
      await prisma.notification.updateMany({
        where: { vendorId: session.user.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    if (parsed.data.action === "markAsRead" && parsed.data.notificationId) {
      // Ensure the notification belongs to the user
      const notification = await prisma.notification.findUnique({
        where: { id: parsed.data.notificationId },
      })

      if (!notification || notification.vendorId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      await prisma.notification.update({
        where: { id: parsed.data.notificationId },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const notificationId = searchParams.get("id")

    if (action === "clearAll") {
      await prisma.notification.deleteMany({
        where: { vendorId: session.user.id },
      })
      return NextResponse.json({ success: true })
    }

    if (action === "clear" && notificationId) {
      await prisma.notification.delete({
        where: { id: notificationId, vendorId: session.user.id },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error deleting notifications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

