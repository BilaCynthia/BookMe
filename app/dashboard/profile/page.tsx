import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Image as ImageIcon, MapPin, Building } from "lucide-react"

export const metadata = {
  title: "Profile - BookMe",
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const vendorId = session.user.id

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      services: true,
    },
  })

  if (!vendor) redirect("/login")

  // For the MVP, we render a static form. In the next phase, we'll convert this to a Client Component
  // to handle the actual Cloudinary multipart form uploads and updates via our API routes.
  
  // We'll also fetch the PortfolioImages table
  const portfolioImages = await prisma.portfolioImage.findMany({
    where: { vendorId },
    orderBy: { sortOrder: 'asc' }
  })

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Profile</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Update your public-facing business details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Business Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input defaultValue={vendor.name || ""} className="pl-9" disabled />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Bio / Description</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={vendor.bio || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">City / Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input defaultValue={vendor.location || ""} className="pl-9" disabled />
              </div>
            </div>
            <Button disabled className="w-full">Save Changes</Button>
            <p className="text-xs text-muted-foreground text-center">
              (Interactive updates coming soon)
            </p>
          </CardContent>
        </Card>

        {/* Public Link & Links */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your BookMe Link</CardTitle>
              <CardDescription>
                Share this link on Instagram, WhatsApp, or Twitter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Input value={`bookme.ng/${vendor.slug}`} readOnly />
                <Button variant="outline">Copy</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Connect your accounts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Instagram Handle</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">@</span>
                  <Input defaultValue={vendor.instagramHandle || ""} className="pl-8" disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Portfolio Gallery Management */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Gallery</CardTitle>
          <CardDescription>
            Manage your Cloudinary-hosted portfolio images. You can upload up to 10 images.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {portfolioImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center bg-muted/20">
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No images uploaded</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                Upload images of your best work. They will appear on your public booking page.
              </p>
              <Button disabled variant="outline">Upload Image</Button>
              <p className="mt-4 text-xs text-muted-foreground">
                (Cloudinary upload UI coming soon)
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {portfolioImages.map((img) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={img.url} 
                    alt="Portfolio item" 
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="sm" className="h-8" disabled>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              
              {portfolioImages.length < 10 && (
                <div className="flex flex-col items-center justify-center aspect-square rounded-md border border-dashed hover:bg-muted/50 cursor-pointer transition-colors disabled:opacity-50">
                   <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" />
                   <span className="text-xs text-muted-foreground font-medium">Add Image</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
