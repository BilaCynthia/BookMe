import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"

export default async function VendorProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const vendor = await prisma.vendor.findFirst({
    where: { slug: { equals: params.slug, mode: "insensitive" } },
    select: {
      id: true,
      isActive: true,
      name: true,
      profilePhoto: true,
      bio: true,
      location: true,
      category: true,
    },
  })

  if (!vendor || !vendor.isActive) {
    notFound()
  }

  // Next.js App Router layouts cannot pass props directly to `children`.
  // However, since this layout runs server-side, it successfully guards the route
  // and throws 404 if the vendor doesn't exist. The child page can safely use
  // React's `cache` or just re-fetch (Prisma dedupes requests in the same pass) 
  // to get the vendor details without hitting the database twice.
  
  return <div className="min-h-screen bg-background">{children}</div>
}
