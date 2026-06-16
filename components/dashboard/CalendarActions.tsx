"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"
import { OpenDatesModal } from "@/components/dashboard/OpenDatesModal"
import { useRouter } from "next/navigation"

interface CalendarActionsProps {
  existingDates: string[]
}

export function CalendarActions({ existingDates }: CalendarActionsProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    // Refresh the server component data after opening dates
    router.refresh()
  }

  return (
    <>
      <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Open New Dates
      </Button>

      <OpenDatesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        existingDates={existingDates}
      />
    </>
  )
}

export function EmptyCalendarAction({ existingDates }: CalendarActionsProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>Open Dates</Button>

      <OpenDatesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        existingDates={existingDates}
      />
    </>
  )
}
