"use client"

import * as React from "react"

export function ProfileViewTracker({ vendorId }: { vendorId: string }) {
  React.useEffect(() => {
    // Only track once per session
    const hasViewed = sessionStorage.getItem(`viewed_profile_${vendorId}`)
    if (!hasViewed) {
      fetch(`/api/vendors/${vendorId}/track-view`, { method: "POST" })
        .then((res) => {
          if (res.ok) {
            sessionStorage.setItem(`viewed_profile_${vendorId}`, "true")
          }
        })
        .catch(() => {})
    }
  }, [vendorId])

  return null
}
