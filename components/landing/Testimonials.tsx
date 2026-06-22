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
          <div className="flex flex-col justify-between rounded-2xl bg-primary p-8 shadow-lg transition-transform hover:-translate-y-1">
            <p className="font-serif text-base italic leading-relaxed text-primary-foreground/90">
              &quot;I used to hold dates for people who never paid. With BookMe, if there&apos;s no deposit, there&apos;s no booking. Simple.&quot;
            </p>
            <p className="mt-8 text-sm font-medium text-secondary">
              Sade A., Wedding Photographer, Lagos
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-primary p-8 shadow-lg transition-transform hover:-translate-y-1">
            <p className="font-serif text-base italic leading-relaxed text-primary-foreground/90">
              &quot;My clients actually take the booking seriously now. They show up because they&apos;ve already paid.&quot;
            </p>
            <p className="mt-8 text-sm font-medium text-secondary">
              Emeka O., Event Decorator, Abuja
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-primary p-8 shadow-lg transition-transform hover:-translate-y-1">
            <p className="font-serif text-base italic leading-relaxed text-primary-foreground/90">
              &quot;I shared my BookMe link in my Instagram bio and got two confirmed bookings in the first week.&quot;
            </p>
            <p className="mt-8 text-sm font-medium text-secondary">
              Chisom N., Makeup Artist, Port Harcourt
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
