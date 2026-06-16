import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export function Pricing() {
  return (
    <section className="bg-surface px-4 py-12 text-center md:px-6 md:py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-subtle">
          Pricing
        </p>
        <h2 className="mb-4 font-heading text-2xl font-bold text-foreground md:text-3xl">
          Free to start. We only earn when you do.
        </h2>
        <p className="mb-8 max-w-2xl text-base text-subtle">
          BookMe takes a small commission on each confirmed deposit. No monthly fees. No upfront cost. If you're not booking, you're not paying.
        </p>

        <div className="mb-8 flex flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">No subscription fees</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">No setup cost</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Commission only on confirmed bookings</span>
          </div>
        </div>

        <Link
          href="/signup"
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          Create your free profile
        </Link>
      </div>
    </section>
  )
}
