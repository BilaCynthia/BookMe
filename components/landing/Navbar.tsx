import Link from "next/link"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="font-heading text-xl font-bold text-primary">
          BookMe
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden text-sm font-medium text-foreground hover:text-primary md:block">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Create free profile
          </Link>
        </div>
      </div>
    </header>
  )
}
