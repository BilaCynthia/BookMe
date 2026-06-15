import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { BookingStatus } from "@prisma/client"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-accent text-accent-foreground hover:bg-accent/80",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export type BadgeVariant = "default" | "success" | "warning" | "destructive" | "outline"

const statusVariantMap: Record<string, BadgeVariant> = {
  PENDING: "warning",
  CONFIRMED: "success",
  EXPIRED: "outline",
  CANCELLED: "destructive",
  COMPLETED: "default",
}

export interface BookingStatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: BookingStatus | string
}

function BookingStatusBadge({ status, className, ...props }: BookingStatusBadgeProps) {
  const statusStr = (status || "PENDING") as string
  const variant = statusVariantMap[statusStr] || "default"
  
  // Format the status to be Title Case (e.g., PENDING -> Pending)
  const formattedStatus = statusStr.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

  return (
    <Badge variant={variant} className={className} {...props}>
      {formattedStatus}
    </Badge>
  )
}

export { Badge, badgeVariants, BookingStatusBadge }
