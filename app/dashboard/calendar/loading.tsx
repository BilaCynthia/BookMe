export default function GenericDashboardLoading() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-muted" />
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="p-6 border-b border-border space-y-2">
          <div className="h-5 w-36 rounded-lg bg-muted" />
          <div className="h-3.5 w-64 rounded-lg bg-muted" />
        </div>
        <div className="p-6 grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
