# Skill: Cloudinary Media Management

## Purpose

This skill covers all image upload, storage, transformation, and deletion for BookMe using Cloudinary.
Used for vendor profile photos and portfolio images.

---

## When to Use This Skill

- Building the portfolio image upload feature
- Building the profile photo upload feature
- Deleting images when a vendor removes them
- Applying image transformations (compression, resizing)
- Setting up signed upload endpoints
- Debugging image upload failures

---

## Environment Variables

```bash
CLOUDINARY_CLOUD_NAME=bookme
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...     # Server-only — never expose to client
```

---

## File Structure

```
lib/
└── cloudinary/
    ├── upload.ts           # Server-side upload function
    ├── delete.ts           # Server-side deletion function
    └── transforms.ts       # URL transformation helpers
```

---

## Upload Limits & Rules

| Item | Limit | Enforcement |
|---|---|---|
| Portfolio images per vendor | Max 10 | Validated before upload in API route |
| Portfolio image file size | Max 5MB input, compressed to ≤ 1MB output | Cloudinary transformation |
| Profile photo file size | Max 2MB input, compressed to ≤ 500KB output | Cloudinary transformation |
| Accepted formats | JPEG, PNG, WebP | Validated server-side before upload |
| Folder structure | `bookme/vendors/[vendorId]/portfolio/` | Set in upload call |

---

## Server-Side Upload

```typescript
// lib/cloudinary/upload.ts
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface UploadPortfolioImageParams {
  vendorId: string
  fileBuffer: Buffer
  mimeType: string            // "image/jpeg" | "image/png" | "image/webp"
}

interface UploadResult {
  url: string                 // Optimised, CDN-served URL
  publicId: string            // Cloudinary public ID (needed for deletion)
  width: number
  height: number
}

export async function uploadPortfolioImage(
  params: UploadPortfolioImageParams
): Promise<UploadResult> {
  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `bookme/vendors/${params.vendorId}/portfolio`,
        transformation: [
          {
            quality: "auto",          // Cloudinary auto-optimises quality
            fetch_format: "auto",     // Serve WebP to browsers that support it
            width: 1200,
            crop: "limit",            // Only downscale, never upscale
          },
        ],
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        max_bytes: 5 * 1024 * 1024,  // 5MB input limit
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    uploadStream.end(params.fileBuffer)
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  }
}

export async function uploadProfilePhoto(
  vendorId: string,
  fileBuffer: Buffer
): Promise<UploadResult> {
  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `bookme/vendors/${params.vendorId}/profile`,
        public_id: "avatar",            // Fixed ID — overwrites previous profile photo
        overwrite: true,
        transformation: [
          {
            width: 400,
            height: 400,
            crop: "fill",
            gravity: "face",            // Auto-detect face for cropping
            quality: "auto",
            fetch_format: "auto",
          },
        ],
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        max_bytes: 2 * 1024 * 1024,    // 2MB input limit
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    uploadStream.end(fileBuffer)
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  }
}
```

---

## Image Deletion

```typescript
// lib/cloudinary/delete.ts
import { v2 as cloudinary } from "cloudinary"

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId)

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary deletion failed: ${result.result}`)
  }
  // "not found" is acceptable — image may have been manually deleted already
}
```

---

## API Route: Upload Portfolio Image

```typescript
// app/api/vendors/portfolio/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { portfolioImages: true },
    })

    if (!vendor) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    if (vendor.portfolioImages.length >= MAX_PORTFOLIO_IMAGES) {
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

    // Save URL to vendor's portfolioImages array
    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        portfolioImages: {
          push: uploaded.url,
        },
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
```

---

## API Route: Delete Portfolio Image

```typescript
// app/api/vendors/portfolio/[publicId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteCloudinaryImage } from "@/lib/cloudinary/delete"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
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

  // Get the Cloudinary URL for this public ID
  const imageUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`

  // Remove from vendor's portfolio array
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { portfolioImages: true },
  })

  const updatedImages = (vendor?.portfolioImages ?? []).filter(
    (url) => !url.includes(publicId)
  )

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { portfolioImages: updatedImages },
  })

  // Delete from Cloudinary
  await deleteCloudinaryImage(publicId)

  return NextResponse.json({ success: true })
}
```

---

## URL Transformation Helpers

```typescript
// lib/cloudinary/transforms.ts
// Build optimised Cloudinary URLs for different display contexts

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`

export function getPortfolioThumbnailUrl(publicId: string): string {
  return `${BASE_URL}/w_400,h_400,c_fill,q_auto,f_auto/${publicId}`
}

export function getPortfolioFullUrl(publicId: string): string {
  return `${BASE_URL}/w_1200,q_auto,f_auto/${publicId}`
}

export function getProfilePhotoUrl(publicId: string): string {
  return `${BASE_URL}/w_200,h_200,c_fill,g_face,q_auto,f_auto/${publicId}`
}
```

---

## What to Never Do

- Never expose `CLOUDINARY_API_SECRET` to the client — all uploads go through the API route
- Never store Cloudinary public IDs separately from URLs — store the full URL in `portfolioImages[]`, derive the public ID when needed for deletion
- Never skip file type validation — always check MIME type server-side
- Never upload directly from the client to Cloudinary without a signed upload preset — use the server-side API route
- Never skip the portfolio count check before uploading