import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { uploadPortfolioImage } from "@/lib/cloudinary/upload"
import { logger } from "@/lib/logger"

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const vendorId = session.user.id

    const formData = await request.formData()
    const file = formData.get("image") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "NO_FILE", message: "No image file was provided." },
        { status: 422 }
      )
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: "INVALID_FILE_TYPE",
          message: "Only JPEG, PNG, and WebP images are accepted.",
        },
        { status: 422 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "FILE_TOO_LARGE",
          message: "Image must be smaller than 10MB.",
        },
        { status: 422 }
      )
    }

    // Check count limit
    const count = await prisma.portfolioImage.count({ where: { vendorId } })
    if (count >= 10) {
      return NextResponse.json(
        { error: "LIMIT_REACHED", message: "You can only upload up to 10 images." },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploaded = await uploadPortfolioImage({
      vendorId,
      fileBuffer: buffer,
      mimeType: file.type
    })

    const newImage = await prisma.portfolioImage.create({
      data: {
        vendorId,
        url: uploaded.url,
        publicId: uploaded.publicId,
        sortOrder: count,
      }
    })

    logger.info("vendor.portfolio.uploaded", { vendorId, imageId: newImage.id })

    return NextResponse.json(
      { image: newImage },
      { status: 200 }
    )

  } catch (error) {
    logger.error("vendor.portfolio.upload.failed", error as Error)
    return NextResponse.json(
      { error: "UPLOAD_FAILED", message: "Image upload failed. Please try again." },
      { status: 500 }
    )
  }
}
