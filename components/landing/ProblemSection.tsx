export function ProblemSection() {
  return (
    <section className="bg-background px-4 py-12 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center md:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 mb-4 text-xs font-bold uppercase tracking-widest text-secondary">
            Sound familiar?
          </div>
          <h2 className="mb-4 font-heading text-3xl font-extrabold text-foreground md:text-4xl tracking-tight">
            You&apos;re losing money every time you hold a date.
          </h2>
          <p className="mx-auto max-w-2xl text-base text-subtle md:text-lg leading-relaxed">
            Most vendors confirm bookings over WhatsApp with a promise. Here&apos;s what that really costs you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:auto-rows-fr">
          
          {/* Card 1: Wide */}
          <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row group">
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center relative z-10">
              <h3 className="mb-2 font-heading text-xl font-bold text-foreground">
                Double-bookings happen.
              </h3>
              <p className="text-sm leading-relaxed text-subtle">
                You hold a date for one client, another pays first, and now you have a massive headache trying to explain the mix-up to the first client.
              </p>
            </div>
            <div className="relative h-48 w-full md:w-2/5 md:h-auto shrink-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&q=80&w=800" 
                alt="Planner and calendar" 
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              {/* Fade to top on mobile, fade to left on desktop to blend with text area */}
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent via-surface/40 to-surface" />
            </div>
          </div>

          {/* Card 2: Tall */}
          <div className="md:col-span-1 md:row-span-2 relative overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm transition-all hover:shadow-md flex flex-col group">
            <div className="relative h-56 md:h-[45%] w-full shrink-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800" 
                alt="Person checking phone or finances" 
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/40 to-surface" />
            </div>
            <div className="p-6 md:p-8 flex-1 flex flex-col relative z-10">
              <h3 className="mb-2 font-heading text-xl font-bold text-foreground">
                Deposits get chased forever.
              </h3>
              <p className="text-sm leading-relaxed text-subtle">
                Days pass, follow-ups pile up, and some clients disappear without paying. You are left checking your bank app every 3 hours wondering if they&apos;re serious.
              </p>
            </div>
          </div>

          {/* Card 3: Square */}
          <div className="md:col-span-1 relative overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm transition-all hover:shadow-md flex flex-col group">
            <div className="relative h-40 w-full shrink-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800" 
                alt="Receipts and papers" 
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/40 to-surface" />
            </div>
            <div className="p-6 flex-1 flex flex-col relative z-10">
              <h3 className="mb-2 font-heading text-xl font-bold text-foreground">
                No paper trail.
              </h3>
              <p className="text-sm leading-relaxed text-subtle">
                When disputes happen, you have nothing to fall back on — no receipt, no structured record of the agreement.
              </p>
            </div>
          </div>

          {/* Card 4: Square */}
          <div className="md:col-span-1 relative overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm transition-all hover:shadow-md flex flex-col group">
            <div className="relative h-40 w-full shrink-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=800" 
                alt="Typing aggressively on phone" 
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/40 to-surface" />
            </div>
            <div className="p-6 flex-1 flex flex-col relative z-10">
              <h3 className="mb-2 font-heading text-xl font-bold text-foreground">
                Endless back-and-forth.
              </h3>
              <p className="text-sm leading-relaxed text-subtle">
                You waste hours answering &apos;are you available?&apos; and sending your pricing PDF to people who never book.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
