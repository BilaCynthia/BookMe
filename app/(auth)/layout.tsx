import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden selection:bg-primary/20">
      {/* Background aesthetic blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] opacity-70 animate-in fade-in duration-1000 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px] opacity-70 animate-in fade-in duration-1000 delay-300 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-[440px] p-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* Header centered above the card */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center space-x-3 text-primary group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/20">
              <span className="font-bold text-2xl">B</span>
            </div>
            <span className="font-heading font-bold text-3xl tracking-tight text-foreground">BookMe</span>
          </Link>
        </div>

        {/* Glassmorphic Card */}
        <div className="relative overflow-hidden rounded-[2rem] border border-border/40 bg-surface/80 p-8 shadow-2xl shadow-primary/5 backdrop-blur-2xl sm:p-10 transition-all hover:shadow-primary/10 hover:border-border/60">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-50 mix-blend-overlay pointer-events-none" />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

