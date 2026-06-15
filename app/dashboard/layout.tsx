import Link from "next/link"
import { redirect } from "next/navigation"
import { Calendar, CreditCard, LayoutDashboard, Settings, User } from "lucide-react"

import { auth } from "@/lib/auth"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  if (session.user && session.user.profileCompleted === false) {
    redirect("/onboarding")
  }

  const businessName = session.user?.name || "Vendor Dashboard"

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold text-lg truncate">{businessName}</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Link>
          <Link href="/dashboard/bookings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground">
            <CreditCard className="h-4 w-4" /> Bookings
          </Link>
          <Link href="/dashboard/calendar" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground">
            <Calendar className="h-4 w-4" /> Calendar
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground">
            <User className="h-4 w-4" /> Profile
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 z-50 flex h-16 w-full items-center justify-around border-t bg-card md:hidden">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-medium">Overview</span>
        </Link>
        <Link href="/dashboard/bookings" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
          <CreditCard className="h-5 w-5" />
          <span className="text-[10px] font-medium">Bookings</span>
        </Link>
        <Link href="/dashboard/calendar" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
          <Calendar className="h-5 w-5" />
          <span className="text-[10px] font-medium">Calendar</span>
        </Link>
        <Link href="/dashboard/profile" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  )
}
