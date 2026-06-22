import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Image as ImageIcon, MapPin, Building } from "lucide-react"
import { CopyLinkInput } from "@/components/dashboard/CopyLinkInput"
import { ProfilePhotoUpload } from "@/components/dashboard/ProfilePhotoUpload"
import { PortfolioGallery } from "@/components/dashboard/PortfolioGallery"

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

  const portfolioImages = await prisma.portfolioImage.findMany({
    where: { vendorId },
    orderBy: { sortOrder: 'asc' }
  })

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Profile</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-200">
        {/* Business Information */}
        <div className="rounded-3xl border border-border/50 bg-surface/60 p-6 sm:p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
          <div className="mb-6 space-y-1">
            <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">Business Information</h3>
            <p className="text-sm text-subtle">
              Update your public-facing business details.
            </p>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-foreground">Business Name</label>
              <div className="relative">
                <Building className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input defaultValue={vendor.name || ""} className="h-12 rounded-xl pl-11 bg-background border-transparent" disabled />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-foreground">Bio / Description</label>
              <textarea 
                className="flex min-h-[120px] w-full resize-none rounded-xl border-transparent bg-background px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={vendor.bio || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-foreground">City / Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input defaultValue={vendor.location || ""} className="h-12 rounded-xl pl-11 bg-background border-transparent" disabled />
              </div>
            </div>
            <Button className="w-full h-12 rounded-xl">Save Changes</Button>
            <p className="text-xs text-subtle text-center">
              (Interactive updates coming soon)
            </p>
          </div>
        </div>

        {/* Public Link & Links & Photo */}
        <div className="space-y-6">
          <ProfilePhotoUpload currentPhotoUrl={vendor.profilePhoto} />

          <div className="rounded-3xl border border-border/50 bg-surface/60 p-6 sm:p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
            <div className="mb-6 space-y-1">
              <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">Your BookMe Link</h3>
              <p className="text-sm text-subtle">
                Share this link on Instagram, WhatsApp, or Twitter.
              </p>
            </div>
            <div>
              <CopyLinkInput link={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${vendor.slug}`} />
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-surface/60 p-6 sm:p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
            <div className="mb-6 space-y-1">
              <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">Social Links</h3>
              <p className="text-sm text-subtle">Connect your accounts.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground">Instagram Handle</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-muted-foreground text-sm font-medium">@</span>
                  <Input defaultValue={vendor.instagramHandle || ""} className="h-12 rounded-xl pl-8 bg-background border-transparent" disabled />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Gallery Management */}
      <PortfolioGallery initialImages={portfolioImages.map(img => ({ id: img.id, url: img.url }))} />
    </div>
  )
}
