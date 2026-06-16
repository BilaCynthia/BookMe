import Link from "next/link"
import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side: Auth Form */}
      <div className="flex w-full flex-col bg-background lg:w-1/2 relative z-10 lg:shadow-[15px_0_40px_-15px_rgba(0,0,0,0.05)]">
        <header className="flex w-full p-6 md:p-10 justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 text-primary group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105 shadow-sm">
              <span className="font-bold text-xl">B</span>
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight hidden md:inline-block">BookMe</span>
          </Link>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-10 pb-20">
          <div className="w-full max-w-[400px]">
            {children}
          </div>
        </main>
      </div>

      {/* Right side: Image/Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0">
          <Image 
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2000" 
            alt="Event setup" 
            fill
            priority
            className="object-cover opacity-20 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-primary/30" />
        </div>
        
        <div className="relative z-10 mt-auto max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-widest text-secondary shadow-sm">
            Stop losing money
          </div>
          <h2 className="mb-6 font-heading text-4xl font-extrabold tracking-tight leading-tight">
            Confirm bookings instantly with paid deposits.
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
            Join hundreds of Nigerian event vendors who have stopped answering "are you available" and started getting paid automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
