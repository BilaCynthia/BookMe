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
