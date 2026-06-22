"use client"

import * as React from "react"
import { Image as ImageIcon, Loader2, Upload, Trash2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface PortfolioImage {
  id: string
  url: string
}

interface PortfolioGalleryProps {
  initialImages: PortfolioImage[]
}

export function PortfolioGallery({ initialImages }: PortfolioGalleryProps) {
  const router = useRouter()
  const [images, setImages] = React.useState<PortfolioImage[]>(initialImages)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP formats are supported.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB.")
      return
    }

    setError(null)
    setIsUploading(true)

    const formData = new FormData()
    formData.append("image", file)

    try {
      const res = await fetch("/api/vendors/profile/portfolio", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to upload image")
      }

      setImages((prev) => [...prev, data.image])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsUploading(false)
    }
  }

  // Deletion will be implemented in the next iteration
  const handleDelete = async (id: string) => {
    // For now we just remove it optimistically and we'll implement the API endpoint later if needed
    setImages((prev) => prev.filter((img) => img.id !== id))
    // Call the actual DELETE endpoint here
    try {
      await fetch(`/api/vendors/profile/portfolio/${id}`, { method: "DELETE" })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="rounded-3xl border border-border/50 bg-surface/60 p-6 sm:p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-12 duration-200">
      <div className="mb-6 space-y-1">
        <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">Portfolio Gallery</h3>
        <p className="text-sm text-subtle">
          Manage your portfolio images. You can upload up to 10 images.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div>
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/50 p-8 text-center transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No images uploaded</h3>
            <p className="mb-6 mt-1 text-sm text-subtle max-w-sm">
              Upload images of your best work. They will appear on your public booking page.
            </p>
            
            <label 
              className={cn(
                buttonVariants({ variant: "outline" }), 
                "h-12 rounded-xl cursor-pointer px-6",
                isUploading && "pointer-events-none opacity-50"
              )}
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload Image
              <input 
                type="file" 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={img.url} 
                  alt="Portfolio item" 
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-9 rounded-lg" 
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            ))}
            
            {images.length < 10 && (
              <label className={cn(
                "flex flex-col items-center justify-center aspect-square rounded-2xl border border-dashed border-border/60 hover:bg-muted/30 cursor-pointer transition-colors bg-background/50 relative overflow-hidden",
                isUploading && "pointer-events-none opacity-50"
              )}>
                 {isUploading ? (
                   <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                 ) : (
                   <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" />
                 )}
                 <span className="text-xs text-subtle font-medium">Add Image</span>
                 <input 
                  type="file" 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
