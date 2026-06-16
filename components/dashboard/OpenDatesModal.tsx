"use client"

import * as React from "react"
import { format, addDays, startOfToday, isBefore, isSameDay } from "date-fns"
import { Button } from "@/components/ui/Button"
import { ChevronLeft, ChevronRight, Plus, X, Loader2 } from "lucide-react"

interface OpenDatesModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  existingDates: string[] // ISO date strings of already-opened dates
}

export function OpenDatesModal({ isOpen, onClose, onSuccess, existingDates }: OpenDatesModalProps) {
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([])
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  const today = startOfToday()

  // Generate calendar days for the current month view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // Add all days in the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d))
    }

    return days
  }

  const days = getDaysInMonth(currentMonth)

  const isDateSelected = (date: Date) =>
    selectedDates.some((d) => isSameDay(d, date))

  const isDateAlreadyOpen = (date: Date) =>
    existingDates.some((d) => isSameDay(new Date(d), date))

  const toggleDate = (date: Date) => {
    if (isBefore(date, today)) return
    if (isDateAlreadyOpen(date)) return

    setSelectedDates((prev) =>
      isDateSelected(date)
        ? prev.filter((d) => !isSameDay(d, date))
        : [...prev, date]
    )
  }

  const handleSubmit = async () => {
    if (selectedDates.length === 0) return

    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: selectedDates.map((d) => d.toISOString()),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to open dates")
        return
      }

      setSelectedDates([])
      onSuccess()
      onClose()
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const prevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-foreground">Open New Dates</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar */}
        <div className="p-4">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-md p-1 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-md p-1 hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1 text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} />
              }

              const isPast = isBefore(day, today)
              const isSelected = isDateSelected(day)
              const isAlreadyOpen = isDateAlreadyOpen(day)
              const isToday = isSameDay(day, today)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isPast || isAlreadyOpen}
                  onClick={() => toggleDate(day)}
                  className={`
                    flex h-9 w-full items-center justify-center rounded-md text-sm font-medium transition-all
                    ${isPast ? "text-muted-foreground/30 cursor-not-allowed" : ""}
                    ${isAlreadyOpen ? "bg-primary/10 text-primary cursor-not-allowed" : ""}
                    ${isSelected ? "bg-primary text-primary-foreground shadow-sm" : ""}
                    ${!isPast && !isAlreadyOpen && !isSelected ? "hover:bg-muted cursor-pointer" : ""}
                    ${isToday && !isSelected ? "ring-1 ring-primary/50" : ""}
                  `}
                >
                  {format(day, "d")}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-primary" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-primary/10" />
              <span>Already open</span>
            </div>
          </div>

          {/* Selected count */}
          {selectedDates.length > 0 && (
            <p className="mt-3 text-sm text-foreground">
              <span className="font-semibold">{selectedDates.length}</span> date{selectedDates.length !== 1 ? "s" : ""} selected
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t p-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={selectedDates.length === 0 || isSubmitting}
            isLoading={isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            Open {selectedDates.length > 0 ? `${selectedDates.length} Date${selectedDates.length !== 1 ? "s" : ""}` : "Dates"}
          </Button>
        </div>
      </div>
    </div>
  )
}
