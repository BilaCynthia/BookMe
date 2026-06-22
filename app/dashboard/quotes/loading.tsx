export default function QuotesLoading() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-muted" />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <div key={i} className="h-9 w-24 rounded-xl bg-muted" />)}
      </div>
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="p-6 border-b border-border space-y-2">
          <div className="h-5 w-36 rounded-lg bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 rounded-lg bg-muted w-1/2" />
                <div className="h-3 rounded-lg bg-muted w-1/3" />
              </div>
              <div className="h-6 w-20 rounded-full bg-muted" />
              <div className="h-8 w-24 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
