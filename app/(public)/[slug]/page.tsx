import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { MapPin, AtSign, CheckCircle2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/Button"

// Make this page dynamic or revalidate as needed
export const revalidate = 60 // Revalidate every 60 seconds

export default async function VendorProfilePage({
  params,
}: {
  params: { slug: string }
}) {
  let vendor;
  try {
    vendor = await prisma.vendor.findFirst({
      where: { 
        slug: { equals: params.slug, mode: "insensitive" }, 
        isActive: true 
      },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" }
        },
        portfolioImages: {
          orderBy: { sortOrder: "asc" }
        }
      },
    })
  } catch (error: any) {
    return <div className="p-10 text-red-500 font-mono">DATABASE CRASH: {error.message || String(error)}</div>
  }

  if (!vendor) {
    notFound()
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-12 animate-in fade-in duration-500 flex flex-col items-center">
      
      {/* Header / Identity Section */}
      <section className="flex flex-col items-center text-center space-y-4 w-full">
        <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted/50">
          {vendor.profilePhoto ? (
            <img src={vendor.profilePhoto} alt={vendor.name || "Vendor"} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
              {vendor.name?.charAt(0) || "V"}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            {vendor.name}
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-secondary">
            {vendor.category && (
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-secondary">
                {vendor.category.replace("_", " ")}
              </span>
            )}
            {vendor.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {vendor.location}
              </span>
            )}
            {vendor.instagramHandle && (
              <a href={`https://instagram.com/${vendor.instagramHandle.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <AtSign className="h-4 w-4" /> {vendor.instagramHandle}
              </a>
            )}
          </div>
        </div>

        {vendor.bio && (
          <p className="max-w-2xl text-base text-secondary leading-relaxed mt-4">
            {vendor.bio}
          </p>
        )}
      </section>

      {/* Portfolio Gallery */}
      {vendor.portfolioImages.length > 0 && (
        <section className="space-y-6 w-full text-center">
          <h2 className="text-2xl font-bold tracking-tight text-center">Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {vendor.portfolioImages.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img src={img.url} alt="Portfolio item" className="object-cover h-full w-full hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services & Booking */}
      <section className="space-y-6 bg-surface/50 p-6 md:p-8 rounded-3xl border border-border/50 w-full max-w-4xl flex flex-col items-center">
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Services & Pricing</h2>
            <p className="text-sm text-muted-foreground">Select a service to view available dates</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 w-full">
          {vendor.services.length > 0 ? (
            vendor.services.map((service) => (
              <div key={service.id} className="group flex flex-col justify-between items-center text-center rounded-2xl border border-border/60 bg-background p-6 shadow-sm hover:border-primary/50 hover:shadow-md transition-all w-full max-w-md">
                <div className="space-y-3 mb-6 flex flex-col items-center w-full">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-center">{service.name}</h3>
                    {service.serviceType === "QUOTE_REQUIRED" && (
                      <span className="text-xs font-semibold bg-secondary/10 text-secondary-foreground px-2 py-0.5 rounded-full shrink-0">
                        Quote Required
                      </span>
                    )}
                  </div>
                  {service.serviceType === "FIXED_PRICE" ? (
                    <span className="font-semibold text-foreground bg-primary/5 px-3 py-1 rounded-lg w-fit text-sm">
                      ₦{(service.basePrice / 100).toLocaleString()}
                    </span>
                  ) : (
                    <span className="font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-lg w-fit text-sm">
                      Price varies — request a quote
                    </span>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 text-center">
                    {service.description}
                  </p>
                </div>
                
                <div className="space-y-4 border-t pt-4 w-full flex flex-col items-center">
                  {service.serviceType === "FIXED_PRICE" ? (
                    <>
                      <div className="flex flex-col items-center text-sm gap-1">
                        <span className="text-muted-foreground text-xs">Deposit Required</span>
                        <span className="font-medium text-secondary text-base">{service.depositPercentage}%</span>
                      </div>
                      <Button asChild className="w-full group-hover:bg-primary-hover transition-colors">
                        <Link href={`/${vendor.slug}/book?service=${service.id}`}>
                          Check Availability
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Link href={`/${vendor.slug}/quote?service=${service.id}`}>
                        Request a Quote
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 rounded-2xl border border-dashed bg-muted/10">
              <p className="text-muted-foreground">This vendor hasn&apos;t added any services yet.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
