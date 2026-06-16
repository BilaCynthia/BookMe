import Link from "next/link"

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-subtle">
          How BookMe works
        </p>
        <h2 className="mb-12 font-heading text-3xl font-bold text-foreground md:mb-16 md:text-4xl">
          From link to locked date in minutes.
        </h2>

        <div className="relative mb-16 grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-12">
          {/* Decorative connector line on desktop */}
          <div className="absolute left-[15%] top-5 hidden h-[2px] w-[70%] bg-border md:block" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
              01
            </div>
            <h3 className="mb-3 font-heading text-xl font-medium text-foreground">
              Create your profile.
            </h3>
            <p className="max-w-xs text-sm leading-relaxed text-subtle">
              Set up your BookMe page with your services, pricing, and available dates. Share your link anywhere.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
              02
            </div>
            <h3 className="mb-3 font-heading text-xl font-medium text-foreground">
              Client picks a date and pays.
            </h3>
            <p className="max-w-xs text-sm leading-relaxed text-subtle">
              Your client visits your link, selects a date, and pays a deposit directly — no back and forth.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
              03
            </div>
            <h3 className="mb-3 font-heading text-xl font-medium text-foreground">
              Date is locked. Instantly.
            </h3>
            <p className="max-w-xs text-sm leading-relaxed text-subtle">
              The moment payment clears, the date is blocked on your calendar and both of you get a confirmation.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="font-heading text-lg font-medium text-foreground">Ready to get started?</p>
          <Link
            href="/signup"
            className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Create your profile
          </Link>
        </div>
      </div>
    </section>
  )
}
