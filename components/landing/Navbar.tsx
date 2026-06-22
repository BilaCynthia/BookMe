import Link from "next/link"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface px-4 md:px-6">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
        <Link href="/" className="font-heading text-xl font-bold text-primary">
          BookMe
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link 
            href="/login" 
            prefetch={true}
            className="text-sm font-medium text-foreground hover:text-primary flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 rounded-md hover:bg-primary/5 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            prefetch={true}
            className="rounded-md bg-primary px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover shadow-sm transition-all hover:shadow-md flex items-center justify-center whitespace-nowrap"
          >
            Create free profile
          </Link>
        </div>
      </div>
    </header>
  )
}
