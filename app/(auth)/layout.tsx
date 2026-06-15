import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="absolute top-0 w-full p-4">
        <Link href="/" className="flex items-center space-x-2 text-primary">
          <span className="font-bold text-xl tracking-tight">BookMe</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  )
}
