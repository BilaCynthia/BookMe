import { Lock, CalendarCheck, Link2, MailCheck, Wallet } from "lucide-react"
import Image from "next/image"

export function Features() {
  const features = [
    {
      icon: Lock,
      title: "Payment confirms the booking.",
      description: "A client can only hold your date by paying a deposit. No payment, no booking. It's that simple.",
    },
    {
      icon: CalendarCheck,
      title: "Your calendar updates itself.",
      description: "The moment a deposit clears, the date is automatically blocked. You never have to do it manually.",
    },
    {
      icon: Link2,
      title: "One link for everything.",
      description: "Share your BookMe link in your Instagram bio, WhatsApp status, or anywhere. Clients book directly.",
    },
    {
      icon: MailCheck,
      title: "Instant confirmation for everyone.",
      description: "Your client gets a booking confirmation. You get a notification. Everything is documented automatically.",
    },
    {
      icon: Wallet,
      title: "Direct bank payouts.",
      description: "Your deposits securely settle directly into your local Nigerian bank account via Flutterwave infrastructure.",
    },
  ]

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-12 md:mb-16 max-w-2xl mx-auto text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-subtle">
            Why BookMe
          </p>
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-5xl tracking-tight">
            Everything you need.<br />
            <span className="text-subtle">Nothing you don&apos;t.</span>
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Column: Features */}
          <div className="flex flex-col gap-10">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex gap-5 group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-heading text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                      {feature.title}
                    </h3>
                    <p className="text-base leading-relaxed text-subtle">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Image */}
          <div className="relative w-full aspect-[4/5] lg:aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-surface">
            <Image
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=100&w=2000&auto=format&fit=crop"
              alt="Beautiful event setup representing a successfully locked booking"
              fill
              quality={100}
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Elegant gradient overlay to match BookMe theme */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent mix-blend-overlay pointer-events-none" />
            
            {/* Floating UI Element */}
            <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-surface/90 backdrop-blur-md border border-border/50 p-6 shadow-xl transform transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Deposit Received</p>
                  <p className="text-subtle text-xs mt-0.5">Your calendar has been updated.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
