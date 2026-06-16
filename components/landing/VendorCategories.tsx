export function VendorCategories() {
  const categories = [
    "Photographer",
    "Videographer",
    "Decorator",
    "Caterer",
    "MC / DJ",
    "Makeup Artist",
    "Event Planner",
    "And more"
  ]

  return (
    <section className="bg-primary px-4 py-16 text-center md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-3 font-heading text-2xl font-bold text-primary-foreground md:text-3xl">
          Built for every event vendor.
        </h2>
        <p className="mb-10 text-lg text-primary-foreground opacity-90">
          Whatever your service, BookMe works for you.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category, index) => (
            <span
              key={index}
              className="rounded-full bg-primary-tint px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
