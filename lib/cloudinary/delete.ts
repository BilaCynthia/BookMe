import { v2 as cloudinary } from "cloudinary"

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId)

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary deletion failed: ${result.result}`)
  }
  // "not found" is acceptable — image may have been manually deleted already
}
