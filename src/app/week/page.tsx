"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { addWeeks } from "date-fns/addWeeks"
import { subWeeks } from "date-fns/subWeeks"
import { format } from "date-fns/format"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { WeekGrid } from "@/components/blocks/WeekGrid"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"

function WeekContent() {
  const router = useRouter()
  const { blocks, categories, setSelectedDate } = useApp()
  const [weekOffset, setWeekOffset] = useState(0)
  const [baseDate] = useState(new Date())

  const currentDate = weekOffset === 0
    ? baseDate
    : weekOffset > 0
      ? addWeeks(baseDate, weekOffset)
      : subWeeks(baseDate, Math.abs(weekOffset))

  const handlePrev = useCallback(() => setWeekOffset((p) => p - 1), [])
  const handleNext = useCallback(() => setWeekOffset((p) => p + 1), [])
  const handleToday = useCallback(() => setWeekOffset(0), [])

  const handleDayTap = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    setSelectedDate(dateStr)
    router.push(`/today?date=${dateStr}`)
  }, [router, setSelectedDate])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <WeekGrid
            currentDate={currentDate}
            blocks={blocks}
            categories={categories}
            onPrevWeek={handlePrev}
            onNextWeek={handleNext}
            onToday={handleToday}
            onDayTap={handleDayTap}
          />
        </div>
      </main>
      <BottomTab />
    </div>
  )
}

export default function WeekPage() {
  return (
    <AuthGuard>
      <WeekContent />
    </AuthGuard>
  )
}
