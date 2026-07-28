"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { addMonths } from "date-fns/addMonths"
import { subMonths } from "date-fns/subMonths"
import { format } from "date-fns/format"
import { isSameMonth } from "date-fns/isSameMonth"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"
import { getMonthDays, isToday } from "@/lib/time"

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

function MonthContent() {
  const router = useRouter()
  const { blocks, categories, setSelectedDate } = useApp()
  const [baseDate] = useState(new Date())
  const [monthOffset, setMonthOffset] = useState(0)

  const currentMonth = monthOffset === 0
    ? baseDate
    : monthOffset > 0
      ? addMonths(baseDate, monthOffset)
      : subMonths(baseDate, Math.abs(monthOffset))

  const catMap = useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach((c) => { map[c.id] = c.color })
    return map
  }, [categories])

  const weeks = useMemo(() => getMonthDays(currentMonth), [currentMonth])

  const monthBlocks = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return blocks.filter((b) => {
      const d = new Date(b.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
  }, [blocks, currentMonth])

  const dayBlockMap = useMemo(() => {
    const map: Record<string, typeof blocks> = {}
    for (const b of monthBlocks) {
      if (!map[b.date]) map[b.date] = []
      map[b.date].push(b)
    }
    return map
  }, [monthBlocks])

  const handlePrev = useCallback(() => setMonthOffset((p) => p - 1), [])
  const handleNext = useCallback(() => setMonthOffset((p) => p + 1), [])
  const handleToday = useCallback(() => setMonthOffset(0), [])

  const handleDayTap = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    setSelectedDate(dateStr)
    router.push(`/today?date=${dateStr}`)
  }, [router, setSelectedDate])

  const monthLabel = useMemo(() => format(currentMonth, "MMMM yyyy"), [currentMonth])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#8A8F98] transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-[#EDEDEF]">{monthLabel}</h1>
              <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#8A8F98] transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleToday}
                className="ml-1 px-3 py-1 text-xs font-semibold rounded-lg bg-white/[0.08] text-[#8A8F98] hover:bg-white/[0.12] transition-colors"
              >
                Bulan Ini
              </button>
            </div>
          </div>

          {/* Day name headers */}
          <div className="grid grid-cols-7 gap-2">
            {DAY_NAMES.map((name) => (
              <div key={name} className="text-center text-xs font-semibold text-[#8A8F98] uppercase tracking-wide py-2">
                {name}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-2">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-2">
                {week.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd")
                  const dayBlocks = dayBlockMap[dateStr] || []
                  const total = dayBlocks.length
                  const completed = dayBlocks.filter((b) => b.completed).length
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const today = isToday(day)
                  const isPast = day < new Date(new Date().toDateString())

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayTap(day)}
                      className={`flex flex-col gap-1 p-2 rounded-xl transition-all duration-200 text-left min-h-[72px] ${
                        today
                          ? "border-2 border-[#5E6AD2] shadow-sm bg-[rgba(94,106,210,0.1)]"
                          : !isCurrentMonth
                            ? "opacity-30 border border-white/[0.04]"
                            : isPast && total === 0
                              ? "border border-white/[0.04] opacity-60"
                              : "border border-white/[0.06] hover:bg-white/[0.04]"
                      }`}
                      style={{
                        background: today
                          ? "rgba(94,106,210,0.1)"
                          : "linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold leading-none ${today ? "text-[#5E6AD2]" : "text-[#EDEDEF]"}`}>
                          {day.getDate()}
                        </span>
                        {total > 0 && (
                          <span className="text-[10px] font-medium text-[#8A8F98]">{completed}/{total}</span>
                        )}
                      </div>
                      {total > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-auto">
                          {dayBlocks.slice(0, 4).map((b) => (
                            <div
                              key={b.id}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: b.color ?? catMap[b.categoryId] ?? "#6B7280" }}
                            />
                          ))}
                          {dayBlocks.length > 4 && (
                            <span className="text-[9px] text-[#8A8F98]">+{dayBlocks.length - 4}</span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomTab />
    </div>
  )
}

export default function MonthPage() {
  return (
    <AuthGuard>
      <MonthContent />
    </AuthGuard>
  )
}
