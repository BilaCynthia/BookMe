import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { v2 as cloudinary } from "cloudinary"
import { logger } from "@/lib/logger"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const vendorId = session.user.id
    const imageId = params.id

    const image = await prisma.portfolioImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    if (image.vendorId !== vendorId) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.publicId)

    // Delete from DB
    await prisma.portfolioImage.delete({
      where: { id: imageId },
    })

    logger.info("vendor.portfolio.deleted", { vendorId, imageId })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logger.error("vendor.portfolio.delete.failed", error as Error)
    return NextResponse.json(
      { error: "DELETE_FAILED", message: "Failed to delete image." },
      { status: 500 }
    )
  }
}
