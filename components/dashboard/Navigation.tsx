"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, CreditCard, LayoutDashboard, Package, Settings, User, DollarSign, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bookings", href: "/dashboard/bookings", icon: CreditCard },
  { name: "Quotes", href: "/dashboard/quotes", icon: MessageSquare },
  { name: "Earnings", href: "/dashboard/earnings", icon: DollarSign },
  { name: "Services", href: "/dashboard/services", icon: Package },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 pt-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-150 active:scale-95",
              isActive
                ? "bg-primary text-primary-foreground font-bold shadow-md"
                : "text-foreground font-medium hover:bg-muted/50 hover:text-primary"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
              )}
            />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={cn(
              "group relative flex flex-1 flex-col items-center justify-center gap-1.5 p-2 transition-all duration-150 rounded-xl h-full active:scale-95",
              isActive
                ? "text-primary-foreground font-bold bg-primary shadow-md"
                : "text-muted-foreground font-medium hover:text-primary hover:bg-muted/30"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="text-[10px]">{item.name}</span>
          </Link>
        )
      })}
    </>
  )
}
