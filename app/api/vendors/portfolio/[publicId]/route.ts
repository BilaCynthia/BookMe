import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { deleteCloudinaryImage } from "@/lib/cloudinary/delete"
import { logger } from "@/lib/logger"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const vendorId = session.user.id
    const publicId = decodeURIComponent(params.publicId)

    // Verify the image belongs to this vendor
    // Cloudinary public IDs are in format: bookme/vendors/[vendorId]/portfolio/[filename]
    if (!publicId.startsWith(`bookme/vendors/${vendorId}/`)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
    }

    // Delete PortfolioImage record from database
    await prisma.portfolioImage.deleteMany({
      where: {
        vendorId,
        publicId,
      },
    })

    // Delete from Cloudinary
    await deleteCloudinaryImage(publicId)

    logger.info("portfolio.image.deleted", { vendorId, publicId })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("portfolio.delete.failed", error as Error)
    return NextResponse.json(
      { error: "DELETE_FAILED", message: "Image deletion failed. Please try again." },
      { status: 500 }
    )
  }
}
