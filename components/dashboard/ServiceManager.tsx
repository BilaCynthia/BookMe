"use client"

import * as React from "react"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Package,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────
interface Service {
  id: string
  name: string
  description: string
  basePrice: number       // stored in kobo
  depositPercentage: number
  isActive: boolean
  createdAt: string
}

interface ServiceManagerProps {
  initialServices: Service[]
}

interface FormData {
  name: string
  description: string
  basePrice: string       // string for form input — converted to number on submit
  depositPercentage: string
}

interface FieldErrors {
  name?: string[]
  description?: string[]
  basePrice?: string[]
  depositPercentage?: string[]
}

const EMPTY_FORM: FormData = {
  name: "",
  description: "",
  basePrice: "",
  depositPercentage: "50",
}

// ─── Helpers ─────────────────────────────────────────────────

/** Format kobo to Naira display string */
function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`
}

/** Calculate deposit amount in kobo */
function calcDeposit(basePriceKobo: number, pct: number): number {
  return Math.floor(basePriceKobo * pct / 100)
}

// ─── Component ─────────────────────────────────────────────────

export function ServiceManager({ initialServices }: ServiceManagerProps) {
  const [services, setServices] = React.useState<Service[]>(initialServices)
  const [showForm, setShowForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [apiError, setApiError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)

  const activeServices = services.filter((s) => s.isActive)
  const inactiveServices = services.filter((s) => !s.isActive)

  // ── Open form for new service ──
  function handleAdd() {
    setFormData(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
    setApiError(null)
    setShowForm(true)
  }

  // ── Open form for editing ──
  function handleEdit(service: Service) {
    setFormData({
      name: service.name,
      description: service.description,
      basePrice: String(service.basePrice / 100), // kobo → Naira
      depositPercentage: String(service.depositPercentage),
    })
    setEditingId(service.id)
    setErrors({})
    setApiError(null)
    setShowForm(true)
  }

  // ── Close form ──
  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setErrors({})
    setApiError(null)
  }

  // ── Client-side validation ──
  function validate(): boolean {
    const newErrors: FieldErrors = {}
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = ["Service name must be at least 2 characters"]
    }
    if (formData.name && formData.name.length > 100) {
      newErrors.name = ["Service name must be 100 characters or less"]
    }
    if (!formData.description || formData.description.trim().length < 2) {
      newErrors.description = ["Description must be at least 2 characters"]
    }
    if (formData.description && formData.description.length > 200) {
      newErrors.description = ["Description must be 200 characters or less"]
    }
    const price = Number(formData.basePrice)
    if (!formData.basePrice || isNaN(price) || price < 1000) {
      newErrors.basePrice = ["Minimum price is ₦1,000"]
    }
    if (price > 100_000_000) {
      newErrors.basePrice = ["Maximum price is ₦100,000,000"]
    }
    const deposit = Number(formData.depositPercentage)
    if (!formData.depositPercentage || isNaN(deposit) || deposit < 10 || deposit > 100) {
      newErrors.depositPercentage = ["Deposit must be between 10% and 100%"]
    }
    if (deposit !== Math.floor(deposit)) {
      newErrors.depositPercentage = ["Deposit percentage must be a whole number"]
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit form (create or update) ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (!validate()) return

    setIsSubmitting(true)

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      basePrice: Number(formData.basePrice),
      depositPercentage: Number(formData.depositPercentage),
    }

    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details)
        } else {
          setApiError(data.message || "Something went wrong.")
        }
        return
      }

      if (editingId) {
        setServices((prev) =>
          prev.map((s) => (s.id === editingId ? data : s))
        )
      } else {
        setServices((prev) => [data, ...prev])
      }

      handleCancel()
    } catch {
      setApiError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Delete (soft-delete) ──
  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this service? It will be deactivated but existing bookings will be preserved.")) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" })
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isActive: false } : s))
        )
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setDeletingId(null)
    }
  }

  // ── Toggle active/inactive ──
  async function handleToggle(id: string, currentActive: boolean) {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      })

      if (res.ok) {
        const updated = await res.json()
        setServices((prev) =>
          prev.map((s) => (s.id === id ? updated : s))
        )
      }
    } catch {
      // Silently fail
    } finally {
      setTogglingId(null)
    }
  }

  // ── Deposit preview calculation ──
  const previewPrice = Number(formData.basePrice) || 0
  const previewPct = Number(formData.depositPercentage) || 0
  const previewDeposit = previewPrice > 0 && previewPct > 0
    ? Math.floor(previewPrice * previewPct / 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Services
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the services you offer. Clients will choose from these when booking.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* ── Add/Edit Form ── */}
      {showForm && (
        <Card className="border-secondary/40 shadow-md animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {editingId ? "Edit Service" : "New Service"}
              </CardTitle>
              <button
                onClick={handleCancel}
                className="rounded-full p-1.5 hover:bg-muted transition-colors"
                aria-label="Close form"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <CardDescription>
              {editingId
                ? "Update your service details below."
                : "Fill in the details for your new service offering."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {apiError && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {apiError}
                </div>
              )}

              {/* Service name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="service-name"
                  className="text-sm font-medium leading-none"
                >
                  Service Name
                </label>
                <Input
                  id="service-name"
                  placeholder="e.g. Wedding Photography Package"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  error={errors.name?.[0]}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label
                  htmlFor="service-desc"
                  className="text-sm font-medium leading-none"
                >
                  Description
                </label>
                <textarea
                  id="service-desc"
                  placeholder="Briefly describe what this service includes..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  maxLength={200}
                  rows={3}
                  className={cn(
                    "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    errors.description
                      ? "border-destructive focus-visible:ring-destructive"
                      : "border-input"
                  )}
                />
                {errors.description && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.description[0]}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/200 characters
                </p>
              </div>

              {/* Price & Deposit */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="service-price"
                    className="text-sm font-medium leading-none"
                  >
                    Base Price (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      ₦
                    </span>
                    <Input
                      id="service-price"
                      type="number"
                      placeholder="150000"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, basePrice: e.target.value }))
                      }
                      error={errors.basePrice?.[0]}
                      className="pl-8"
                      min={1000}
                      step={100}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="service-deposit"
                    className="text-sm font-medium leading-none"
                  >
                    Deposit Percentage
                  </label>
                  <div className="relative">
                    <Input
                      id="service-deposit"
                      type="number"
                      placeholder="50"
                      value={formData.depositPercentage}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          depositPercentage: e.target.value,
                        }))
                      }
                      error={errors.depositPercentage?.[0]}
                      className="pr-8"
                      min={10}
                      max={100}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Deposit Preview */}
              {previewDeposit > 0 && (
                <div className="rounded-lg border bg-secondary-tint/40 p-4">
                  <p className="text-sm font-medium text-foreground">
                    Booking Preview
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Base Price</p>
                      <p className="font-semibold text-foreground">
                        ₦{previewPrice.toLocaleString("en-NG")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deposit ({previewPct}%)</p>
                      <p className="font-semibold text-secondary-foreground">
                        ₦{previewDeposit.toLocaleString("en-NG")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Balance Due</p>
                      <p className="font-semibold text-foreground">
                        ₦{(previewPrice - previewDeposit).toLocaleString("en-NG")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={isSubmitting}>
                  {editingId ? "Save Changes" : "Create Service"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Services List ── */}
      {services.length === 0 && !showForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No services yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Create your first service to start accepting bookings. Clients
              will see these services on your public booking page.
            </p>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Services */}
          {activeServices.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Active Services ({activeServices.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {activeServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={() => handleEdit(service)}
                    onDelete={() => handleDelete(service.id)}
                    onToggle={() => handleToggle(service.id, service.isActive)}
                    isDeleting={deletingId === service.id}
                    isToggling={togglingId === service.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Services */}
          {inactiveServices.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Inactive Services ({inactiveServices.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {inactiveServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={() => handleEdit(service)}
                    onDelete={() => handleDelete(service.id)}
                    onToggle={() => handleToggle(service.id, service.isActive)}
                    isDeleting={deletingId === service.id}
                    isToggling={togglingId === service.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Service Card ─────────────────────────────────────────────────

interface ServiceCardProps {
  service: Service
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  isDeleting: boolean
  isToggling: boolean
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
  onToggle,
  isDeleting,
  isToggling,
}: ServiceCardProps) {
  const depositAmount = calcDeposit(service.basePrice, service.depositPercentage)

  return (
    <Card
      className={cn(
        "group relative transition-all hover:shadow-md",
        !service.isActive && "opacity-60"
      )}
    >
      <CardContent className="p-5">
        {/* Top row: name + status badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate text-base">
              {service.name}
            </h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {service.description}
            </p>
          </div>
          <Badge
            variant={service.isActive ? "success" : "outline"}
            className="shrink-0"
          >
            {service.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Pricing info */}
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/30 p-3 mb-4">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Price
            </p>
            <p className="text-sm font-bold text-foreground mt-0.5">
              {formatNaira(service.basePrice)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Deposit
            </p>
            <p className="text-sm font-bold text-secondary-foreground mt-0.5">
              {service.depositPercentage}%
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Due
            </p>
            <p className="text-sm font-bold text-foreground mt-0.5">
              {formatNaira(depositAmount)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-1.5 text-xs flex-1"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            disabled={isToggling}
            className="gap-1.5 text-xs"
            aria-label={service.isActive ? "Deactivate service" : "Reactivate service"}
          >
            {service.isActive ? (
              <ToggleRight className="h-3.5 w-3.5" />
            ) : (
              <ToggleLeft className="h-3.5 w-3.5" />
            )}
            {service.isActive ? "Deactivate" : "Reactivate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label="Delete service"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
