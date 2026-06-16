// TODO: Replace placeholder quotes with real vendor testimonials after closed beta.

export function Testimonials() {
  return (
    <section className="bg-background px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-subtle">
            Early vendors
          </p>
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            What vendors are saying.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-6">
            <p className="font-serif text-sm italic leading-relaxed text-foreground">
              "I used to hold dates for people who never paid. With BookMe, if there's no deposit, there's no booking. Simple."
            </p>
            <p className="mt-6 text-xs font-medium text-subtle">
              Sade A., Wedding Photographer, Lagos
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-6">
            <p className="font-serif text-sm italic leading-relaxed text-foreground">
              "My clients actually take the booking seriously now. They show up because they've already paid."
            </p>
            <p className="mt-6 text-xs font-medium text-subtle">
              Emeka O., Event Decorator, Abuja
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-6">
            <p className="font-serif text-sm italic leading-relaxed text-foreground">
              "I shared my BookMe link in my Instagram bio and got two confirmed bookings in the first week."
            </p>
            <p className="mt-6 text-xs font-medium text-subtle">
              Chisom N., Makeup Artist, Port Harcourt
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
