import Link from "next/link"
import { redirect } from "next/navigation"
import { LogOut } from "lucide-react"

import { auth, signOut } from "@/lib/auth"
import { DesktopNav, MobileNav } from "@/components/dashboard/Navigation"
import { NotificationBell } from "@/components/dashboard/NotificationBell"

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
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border/50 bg-surface/40 backdrop-blur-xl md:flex z-10">
        <div className="flex h-20 items-center px-6">
          <Link href="/dashboard" className="group flex items-center space-x-3 text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <span className="text-sm font-bold">B</span>
            </div>
            <span className="truncate font-heading text-xl font-bold tracking-tight">{businessName}</span>
          </Link>
        </div>
        <div className="px-4 pb-4">
          <DesktopNav />
        </div>
        <div className="p-4 mt-auto">
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:scale-95">
              <LogOut className="h-4 w-4 pointer-events-none" /> <span className="pointer-events-none">Logout</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative flex flex-col">
        {/* Subtle Background Glow for main content area */}
        <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-end px-6 md:px-10">
          <NotificationBell />
        </header>

        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 z-50 flex h-20 w-full items-center justify-around border-t border-border/50 bg-surface/80 backdrop-blur-xl md:hidden">
        <MobileNav />
        <form action={async () => {
          "use server"
          await signOut({ redirectTo: "/login" })
        }}>
          <button type="submit" className="flex flex-1 flex-col items-center justify-center gap-1.5 p-2 text-destructive transition-colors h-full active:scale-95">
            <LogOut className="h-5 w-5 pointer-events-none" />
            <span className="text-[10px] font-medium pointer-events-none">Logout</span>
          </button>
        </form>
      </nav>
    </div>
  )
}
