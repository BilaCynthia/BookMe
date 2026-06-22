import { Camera, Video, Palette, Utensils, Mic2, Brush, CalendarDays, Sparkles } from "lucide-react"

export function VendorCategories() {
  const categories = [
    { name: "Photographer", icon: Camera },
    { name: "Videographer", icon: Video },
    { name: "Decorator", icon: Palette },
    { name: "Caterer", icon: Utensils },
    { name: "MC / DJ", icon: Mic2 },
    { name: "Makeup Artist", icon: Brush },
    { name: "Event Planner", icon: CalendarDays },
    { name: "And more...", icon: Sparkles }
  ]

  return (
    <section className="relative overflow-hidden bg-primary px-4 py-16 md:px-6 md:py-24">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -z-0 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-hover/50 blur-[100px]" />
      </div>
      
      <div className="relative mx-auto max-w-6xl z-10 text-center">
        <div className="mb-12 md:mb-16">
          <h2 className="mb-4 font-heading text-3xl font-bold text-primary-foreground md:text-5xl tracking-tight">
            Built for <span className="text-secondary italic">every</span> event vendor.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 leading-relaxed">
            From behind the lens to behind the decks, BookMe adapts to your workflow. Secure your dates instantly, no matter what service you provide.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <div
                key={index}
                className="group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/20 hover:border-white/20 hover:bg-white/10"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-secondary/0 via-secondary/0 to-secondary/0 transition-all duration-500 group-hover:from-secondary/5 group-hover:to-transparent" />
                
                <div className="mb-5 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-sm sm:text-base md:text-lg font-medium text-primary-foreground tracking-tight">
                  {category.name}
                </h3>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
