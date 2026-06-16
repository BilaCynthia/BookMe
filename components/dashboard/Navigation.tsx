"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, CreditCard, LayoutDashboard, Package, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bookings", href: "/dashboard/bookings", icon: CreditCard },
  { name: "Services", href: "/dashboard/services", icon: Package },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DesktopNav() {
  const pathname = usePathname()
  
  return (
    <nav className="flex-1 space-y-2 pt-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200",
              isActive 
                ? "bg-primary/10 text-primary font-bold shadow-sm" 
                : "text-foreground font-medium hover:bg-muted/50 hover:text-primary"
            )}
          >
            <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} /> 
            {item.name}
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
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 transition-all duration-200 rounded-xl",
              isActive 
                ? "text-primary font-bold bg-primary/10" 
                : "text-muted-foreground font-medium hover:text-primary hover:bg-muted/30"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px]">{item.name}</span>
          </Link>
        )
      })}
    </>
  )
}
