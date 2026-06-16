import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="relative w-full overflow-hidden bg-primary border-y border-primary-hover">
      
      {/* Decorative background gradients */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 items-stretch w-full">
        
        {/* Left Column: Text */}
        <div className="flex flex-col items-start text-left py-16 px-6 sm:px-12 md:pr-12 lg:pl-24 xl:pl-32 justify-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-tint/10 px-3 py-1 text-xs font-medium text-primary-foreground border border-primary-tint/20">
            <Sparkles className="h-3 w-3" /> Ready to transform your business?
          </div>
          
          <h2 className="mb-6 font-heading text-3xl font-extrabold tracking-tight text-primary-foreground md:text-5xl lg:leading-tight">
            Stop holding dates for free.
          </h2>
          
          <p className="mb-10 max-w-md text-base text-primary-foreground opacity-90 md:text-lg leading-relaxed">
            Join vendors across Nigeria who are done chasing deposits and ready to get paid first.
          </p>
          
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary border-2 border-primary-tint/20 px-8 py-4 font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary-hover hover:shadow-xl text-sm md:text-base"
          >
            Create your free profile
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          
          <p className="mt-5 text-sm font-medium tracking-wide text-primary-foreground opacity-70">
            No credit card required. Free to get started.
          </p>
        </div>

        {/* Right Column: Image */}
        <div className="relative hidden md:block min-h-[400px] lg:min-h-[500px] w-full">
          <img 
            src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1000&auto=format&fit=crop" 
            alt="Event photographer working at a wedding" 
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Gradient overlay to seamlessly blend the image edge with the primary background color */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
        </div>
        
      </div>
    </section>
  )
}
