"use client"

import * as React from "react"
import { Upload, Loader2, UserRound } from "lucide-react"
import { buttonVariants } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

interface ProfilePhotoUploadProps {
  currentPhotoUrl: string | null
}

export function ProfilePhotoUpload({ currentPhotoUrl }: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(currentPhotoUrl)
  const [error, setError] = React.useState<string | null>(null)
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP formats are supported.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.")
      return
    }

    setError(null)
    setIsUploading(true)

    const formData = new FormData()
    formData.append("image", file)

    try {
      const res = await fetch("/api/vendors/profile/photo", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to upload image")
      }

      setPhotoUrl(data.url)
      // Small timeout to allow the image to load on screen if needed
      setTimeout(() => setIsUploading(false), 500)
    } catch (err) {
      setIsUploading(false)
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    }
  }

  return (
    <div className="rounded-3xl border border-border/50 bg-surface/60 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md sm:p-8">
      <div className="mb-6 space-y-1">
        <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">Profile Picture</h3>
        <p className="text-sm text-subtle">
          Upload a profile picture to show your clients who they are booking.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border/50 bg-background/50 shadow-sm">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={photoUrl} 
              alt="Profile" 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/20">
              <UserRound className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap gap-3">
            <label 
              className={cn(
                buttonVariants({ variant: "outline" }), 
                "h-12 rounded-xl cursor-pointer px-6",
                isUploading && "pointer-events-none opacity-50"
              )}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
              <input 
                type="file" 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>
          <p className="text-xs text-subtle">
            Recommended size: 400x400px. Max 5MB (JPEG, PNG, WebP).
          </p>
          {error && <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-xl">{error}</p>}
        </div>
      </div>
    </div>
  )
}
