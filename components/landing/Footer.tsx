import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-primary py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
        <div className="text-center font-heading text-lg font-bold text-primary-foreground opacity-90 md:text-left">
          BookMe <span className="block text-sm font-normal opacity-70">© 2026 BookMe. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-primary-foreground opacity-80">
          <Link href="#" className="hover:opacity-100">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:opacity-100">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}
