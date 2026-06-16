import { Lock, CalendarCheck, Link2, MailCheck, Camera, Wallet } from "lucide-react"

export function Features() {
  return (
    <section className="bg-background px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-subtle">
            Why BookMe
          </p>
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Everything you need. Nothing you don't.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
            <Lock className="mb-4 h-8 w-8 text-primary" />
            <h3 className="mb-3 font-heading text-xl font-medium text-foreground">
              Payment confirms the booking.
            </h3>
            <p className="text-sm leading-relaxed text-subtle">
              A client can only hold your date by paying a deposit. No payment, no booking. It's that simple.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
            <CalendarCheck className="mb-4 h-8 w-8 text-primary" />
            <h3 className="mb-3 font-heading text-xl font-medium text-foreground">
              Your calendar updates itself.
            </h3>
            <p className="text-sm leading-relaxed text-subtle">
              The moment a deposit clears, the date is automatically blocked. You never have to do it manually.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
            <Link2 className="mb-4 h-8 w-8 text-primary" />
            <h3 className="mb-3 font-heading text-xl font-medium text-foreground">
              One link for everything.
            </h3>
            <p className="text-sm leading-relaxed text-subtle">
              Share your BookMe link in your Instagram bio, WhatsApp status, or anywhere. Clients book directly.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
            <MailCheck className="mb-4 h-8 w-8 text-primary" />
            <h3 className="mb-3 font-heading text-xl font-medium text-foreground">
              Instant confirmation for everyone.
            </h3>
            <p className="text-sm leading-relaxed text-subtle">
              Your client gets a booking confirmation. You get a notification. Everything is documented automatically.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
            <Camera className="mb-4 h-8 w-8 text-primary" />
            <h3 className="mb-3 font-heading text-xl font-medium text-foreground">
              Beautiful portfolio galleries.
            </h3>
            <p className="text-sm leading-relaxed text-subtle">
              Let your work speak for itself. Upload high-quality images to your page to attract higher-paying clients.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
            <Wallet className="mb-4 h-8 w-8 text-primary" />
            <h3 className="mb-3 font-heading text-xl font-medium text-foreground">
              Direct bank payouts.
            </h3>
            <p className="text-sm leading-relaxed text-subtle">
              Your deposits securely settle directly into your local Nigerian bank account via Flutterwave infrastructure.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
