"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReviewFormProps {
  bookingId: string
}

export function ReviewForm({ bookingId }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = React.useState<number>(0)
  const [hoverRating, setHoverRating] = React.useState<number>(0)
  const [review, setReview] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (rating === 0) {
      setError("Please select a star rating.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review: review.trim() || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review")
      }

      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message || String(err))
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-2">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={cn(
                  "w-10 h-10 transition-colors",
                  (hoverRating || rating) >= star
                    ? "fill-secondary text-secondary"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pt-2">
          {rating === 1 && "Terrible"}
          {rating === 2 && "Poor"}
          {rating === 3 && "Okay"}
          {rating === 4 && "Good"}
          {rating === 5 && "Excellent"}
          {rating === 0 && "Select a rating"}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">
          Write a review <span className="text-muted-foreground font-normal">(Optional)</span>
        </label>
        <textarea
          placeholder="What did you love about their service?"
          value={review}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReview(e.target.value)}
          maxLength={500}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none h-32 rounded-xl"
          disabled={isLoading}
        />
        <div className="text-right text-xs text-muted-foreground">
          {review.length}/500
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-center">
          {error}
        </div>
      )}

      <Button 
        type="submit" 
        fullWidth 
        isLoading={isLoading}
        className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30"
      >
        Submit Review
      </Button>
    </form>
  )
}
