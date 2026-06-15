import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { uploadPortfolioImage } from "@/lib/cloudinary/upload"
import { logger } from "@/lib/logger"

const MAX_PORTFOLIO_IMAGES = 10
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const vendorId = session.user.id

    // Check current portfolio count
    const imageCount = await prisma.portfolioImage.count({
      where: { vendorId },
    })

    if (imageCount >= MAX_PORTFOLIO_IMAGES) {
      return NextResponse.json(
        {
          error: "PORTFOLIO_LIMIT_REACHED",
          message: `You can upload a maximum of ${MAX_PORTFOLIO_IMAGES} portfolio images.`,
        },
        { status: 409 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get("image") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "NO_FILE", message: "No image file was provided." },
        { status: 422 }
      )
    }

    // Validate file type
    if (!ACCEPTED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: "INVALID_FILE_TYPE",
          message: "Only JPEG, PNG, and WebP images are accepted.",
        },
        { status: 422 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "FILE_TOO_LARGE",
          message: "Image must be smaller than 5MB.",
        },
        { status: 422 }
      )
    }

    // Convert File to Buffer for Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Cloudinary
    const uploaded = await uploadPortfolioImage({
      vendorId,
      fileBuffer: buffer,
      mimeType: file.type,
    })

    // Save PortfolioImage record
    await prisma.portfolioImage.create({
      data: {
        vendorId,
        url: uploaded.url,
        publicId: uploaded.publicId,
        sortOrder: imageCount,
      },
    })

    logger.info("portfolio.image.uploaded", { vendorId, url: uploaded.url })

    return NextResponse.json(
      { url: uploaded.url, publicId: uploaded.publicId },
      { status: 201 }
    )

  } catch (error) {
    logger.error("portfolio.upload.failed", error as Error)
    return NextResponse.json(
      { error: "UPLOAD_FAILED", message: "Image upload failed. Please try again." },
      { status: 500 }
    )
  }
}
