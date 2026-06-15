import Link from "next/link"
import { Button } from "@/components/ui/Button"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-primary text-xl tracking-tight">BookMe</span>
          </Link>
          <div className="flex items-center">
            <Button asChild variant="default" size="sm">
              <Link href="/signup">Get your booking link</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} BookMe. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline underline-offset-4">Terms</Link>
            <Link href="/privacy" className="hover:underline underline-offset-4">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
