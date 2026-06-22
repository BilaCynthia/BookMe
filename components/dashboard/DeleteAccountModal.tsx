"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { AlertTriangle, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function DeleteAccountModal() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [confirmation, setConfirmation] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState("")
  const router = useRouter()

  const CONFIRM_TEXT = "delete my account"
  const isConfirmed = confirmation.toLowerCase() === CONFIRM_TEXT

  const handleDelete = async () => {
    if (!isConfirmed) return

    setIsDeleting(true)
    setError("")

    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to delete account")
      }

      // Sign out and redirect to home page
      await signOut({ redirect: false })
      router.push("/?deleted=true")
    } catch (err) {
      setError((err as Error).message)
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (isDeleting) return
    setIsOpen(false)
    setConfirmation("")
    setError("")
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        id="delete-account-btn"
        variant="destructive"
        onClick={() => setIsOpen(true)}
        className="shrink-0"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Account
      </Button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          {/* Modal Panel */}
          <div
            className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h2 className="text-lg font-bold text-foreground">Delete Account</h2>
                <p className="text-sm text-muted-foreground">
                  This action is <span className="font-semibold text-destructive">permanent and irreversible</span>. All your data will be wiped immediately.
                </p>
              </div>
            </div>

            {/* What gets deleted */}
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive">The following will be permanently deleted:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Your profile and all personal information</li>
                <li>All services you have listed</li>
                <li>Your calendar and availability slots</li>
                <li>All booking records and history</li>
                <li>Your portfolio images</li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                To confirm, type{" "}
                <span className="font-mono font-bold text-destructive select-all">
                  {CONFIRM_TEXT}
                </span>{" "}
                below:
              </label>
              <input
                type="text"
                id="delete-confirm-input"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                disabled={isDeleting}
                placeholder={CONFIRM_TEXT}
                className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:border-destructive disabled:opacity-50 transition-all"
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                id="confirm-delete-btn"
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={!isConfirmed || isDeleting}
                isLoading={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
