import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { QuotesTable } from "@/components/dashboard/QuotesTable"

export const metadata = { title: "Quote Requests - BookMe" }

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const statusFilter = searchParams.status as string | undefined
  const validStatuses = ["PENDING", "QUOTED", "ACCEPTED", "REJECTED", "EXPIRED"]
  const statusWhere = statusFilter && validStatuses.includes(statusFilter)
    ? { status: statusFilter as never }
    : {}

  const quotes = await prisma.quoteRequest.findMany({
    where: { vendorId: session.user.id, ...statusWhere },
    include: { service: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })

  const counts = await prisma.quoteRequest.groupBy({
    by: ["status"],
    where: { vendorId: session.user.id },
    _count: true,
  })

  const countMap = counts.reduce((acc, c) => {
    acc[c.status] = c._count
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Quote Requests</h2>
          <p className="text-muted-foreground mt-1">Review and respond to client quote requests.</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", value: "" },
          { label: "Pending", value: "PENDING" },
          { label: "Quoted", value: "QUOTED" },
          { label: "Accepted", value: "ACCEPTED" },
          { label: "Rejected", value: "REJECTED" },
          { label: "Expired", value: "EXPIRED" },
        ].map((f) => {
          const isActive = (statusFilter ?? "") === f.value
          const count = f.value ? countMap[f.value] || 0 : quotes.length
          return (
            <a
              key={f.value}
              href={f.value ? `/dashboard/quotes?status=${f.value}` : "/dashboard/quotes"}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-border"}`}>
                  {count}
                </span>
              )}
            </a>
          )
        })}
      </div>

      <QuotesTable quotes={quotes} />
    </div>
  )
}
