import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { uploadProfilePhoto } from "@/lib/cloudinary/upload"
import { logger } from "@/lib/logger"

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB

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
          message: "Image must be smaller than 5MB.",
        },
        { status: 422 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploaded = await uploadProfilePhoto(vendorId, buffer)

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        profilePhoto: uploaded.url,
      },
      select: {
        profilePhoto: true,
      }
    })

    logger.info("vendor.profilePhoto.uploaded", { vendorId, url: uploaded.url })

    return NextResponse.json(
      { url: updatedVendor.profilePhoto },
      { status: 200 }
    )

  } catch (error) {
    logger.error("vendor.profilePhoto.upload.failed", error as Error)
    return NextResponse.json(
      { error: "UPLOAD_FAILED", message: "Image upload failed. Please try again." },
      { status: 500 }
    )
  }
}
