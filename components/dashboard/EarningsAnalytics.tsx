"use client"

import { useState, useMemo } from "react"
import { ChevronDown } from "lucide-react"

// Types
type OmittedBooking = {
  id: string
  basePrice: number
  depositAmount: number
  createdAt: Date
  eventDate: Date
}

type Props = {
  bookings: OmittedBooking[]
}

export function EarningsAnalytics({ bookings }: Props) {
  const currentDate = new Date()
  const [year, setYear] = useState<number>(currentDate.getFullYear())
  const [month, setMonth] = useState<number>(currentDate.getMonth()) // 0-indexed
  
  // Get available years from bookings
  const availableYears = useMemo(() => {
    const years = bookings.map(b => new Date(b.createdAt).getFullYear())
    const uniqueYears = Array.from(new Set([...years, currentDate.getFullYear()]))
    return uniqueYears.sort((a, b) => b - a)
  }, [bookings])

  const monthsList = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ]

  const { dailyData, totalRevenue, totalDeposits, totalBookingsCount } = useMemo(() => {
    // Determine days in the selected month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const data = Array.from({ length: daysInMonth }).map((_, i) => ({
      day: i + 1,
      revenue: 0,
      deposits: 0,
      bookingsCount: 0
    }))

    const filteredBookings = bookings.filter(b => {
      const d = new Date(b.createdAt)
      return d.getFullYear() === year && d.getMonth() === month
    })
    
    let rev = 0
    let dep = 0
    let count = 0

    filteredBookings.forEach(b => {
      const bDate = new Date(b.createdAt)
      const dayIdx = bDate.getDate() - 1 // 0-indexed day
      
      const netBasePrice = Math.floor(b.basePrice * 0.95)
      const netDeposit = Math.floor(b.depositAmount * 0.95)
      
      data[dayIdx].revenue += netBasePrice
      data[dayIdx].deposits += netDeposit
      data[dayIdx].bookingsCount += 1
      
      rev += netBasePrice
      dep += netDeposit
      count += 1
    })

    return { dailyData: data, totalRevenue: rev, totalDeposits: dep, totalBookingsCount: count }
  }, [bookings, year, month])

  const maxRevenue = Math.max(...dailyData.map(m => m.revenue), 1000000)

  const formatNgn = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(kobo / 100)
  }

  return (
    <div className="rounded-3xl border border-border/50 bg-surface/60 p-6 sm:p-8 shadow-sm backdrop-blur-xl flex flex-col w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">Monthly Breakdown</h3>
          <p className="text-sm text-subtle">Detailed daily earnings for the selected month</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <select 
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="appearance-none bg-background/50 border border-border/60 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {monthsList.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none bg-background/50 border border-border/60 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="rounded-2xl border border-border/40 bg-background/50 p-5">
          <p className="text-xs text-subtle mb-1">Expected Revenue (Net, {monthsList[month]})</p>
          <p className="font-heading text-2xl font-bold">{formatNgn(totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-background/50 p-5">
          <p className="text-xs text-subtle mb-1">Secured Deposits (Net, {monthsList[month]})</p>
          <p className="font-heading text-2xl font-bold text-primary">{formatNgn(totalDeposits)}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-background/50 p-5">
          <p className="text-xs text-subtle mb-1">Total Bookings ({monthsList[month]})</p>
          <p className="font-heading text-2xl font-bold">{totalBookingsCount}</p>
        </div>
      </div>
      
      <div className="flex flex-col justify-end gap-2 mt-4">
        <div className="flex h-[250px] items-end justify-between gap-[2px] sm:gap-1 border-b border-border/50 pb-2">
          {dailyData.map((data) => {
            const heightPercentage = Math.max((data.revenue / maxRevenue) * 100, 1)
            const depositHeightPercentage = data.revenue > 0 ? (data.deposits / data.revenue) * 100 : 0
            
            return (
              <div key={data.day} className="group relative flex w-full flex-col items-center justify-end gap-2 h-full">
                <div 
                  className="peer relative w-full rounded-t-sm sm:rounded-t-md bg-primary/20 transition-all hover:bg-primary/30" 
                  style={{ height: `${heightPercentage}%` }}
                >
                  <div 
                    className="absolute bottom-0 w-full rounded-t-sm sm:rounded-t-md bg-primary transition-all group-hover:bg-primary-hover" 
                    style={{ height: `${depositHeightPercentage}%` }} 
                  />
                </div>
                {/* Tooltip */}
                <div className="absolute -top-20 z-10 hidden rounded-md bg-foreground px-3 py-2 text-xs text-background peer-hover:block whitespace-nowrap shadow-xl">
                  <div className="font-semibold text-sm mb-1">{monthsList[month]} {data.day}, {year}</div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted/70">Revenue:</span>
                    <span className="font-medium">{formatNgn(data.revenue)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted/70">Deposits:</span>
                    <span className="font-medium text-primary-foreground">{formatNgn(data.deposits)}</span>
                  </div>
                  <div className="flex justify-between gap-4 mt-1 border-t border-border/20 pt-1">
                    <span className="text-muted/70">Bookings:</span>
                    <span className="font-medium">{data.bookingsCount}</span>
                  </div>
                </div>
                <span className="text-[8px] sm:text-[10px] font-medium text-subtle mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                  {data.day % 5 === 0 || data.day === 1 ? data.day : ''}
                </span>
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-primary/20" />
            <span className="text-subtle">Base Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-primary" />
            <span className="text-subtle">Paid Deposits</span>
          </div>
        </div>
      </div>
    </div>
  )
}
