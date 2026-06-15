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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // max_bytes is unfortunately not a standard Cloudinary SDK option in Node
        // We enforce max_bytes in the API route itself.
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `bookme/vendors/${vendorId}/profile`,
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
