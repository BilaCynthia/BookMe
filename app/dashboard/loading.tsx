export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6 animate-pulse">
      {/* Page Title */}
      <div className="h-8 w-48 rounded-xl bg-muted" />

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <div className="h-4 w-24 rounded-lg bg-muted" />
            <div className="h-8 w-16 rounded-lg bg-muted" />
            <div className="h-3 w-32 rounded-lg bg-muted" />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-6 space-y-4">
            <div className="h-5 w-36 rounded-lg bg-muted" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-3/4 rounded-lg bg-muted" />
                  <div className="h-3 w-1/2 rounded-lg bg-muted" />
                </div>
                <div className="h-6 w-16 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
