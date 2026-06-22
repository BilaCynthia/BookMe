"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Users, AlertCircle, CheckCircle2 } from "lucide-react"

interface BookingPreferencesCardProps {
  initialCapacity: number
}

export function BookingPreferencesCard({ initialCapacity }: BookingPreferencesCardProps) {
  const [capacity, setCapacity] = useState(initialCapacity)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const router = useRouter()

  const handleSave = async () => {
    setIsLoading(true)
    setStatus("idle")
    
    try {
      const res = await fetch("/api/vendors/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dailyCapacity: capacity }),
      })

      if (!res.ok) throw new Error("Failed to update capacity")
      
      setStatus("success")
      router.refresh()
      
      setTimeout(() => {
        setStatus("idle")
      }, 3000)
    } catch (err) {
      console.error(err)
      setStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Preferences</CardTitle>
        <CardDescription>
          Manage how many bookings you can handle simultaneously.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium leading-none">Daily Capacity</label>
              <p className="text-sm text-muted-foreground">
                How many clients can book you on the same day?
              </p>
            </div>
            <div className="relative md:w-32">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                type="number" 
                min={1} 
                max={50}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                className="pl-9" 
              />
            </div>
          </div>
          
          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              Failed to update booking preferences.
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              Preferences updated successfully.
            </div>
          )}

          <div className="pt-2">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || capacity === initialCapacity}
            >
              {isLoading ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
