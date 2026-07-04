"use client"

import { useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { addDays, format, parseISO } from "date-fns"
import { CheckCircle2, Circle, ArrowRight, ChevronLeft, ChevronRight, Clock, Target } from "lucide-react"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { StatCard } from "@/components/ui/StatCard"
import { Button } from "@/components/ui/Button"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"
import { useBlocksByDate } from "@/hooks/useBlocks"
import { formatDisplayDate, formatDate } from "@/lib/time"

function ReviewContent() {
  const router = useRouter()
  const { selectedDate, setSelectedDate, updateBlock, blocks } = useApp()

  const currentDate = selectedDate
  const dayBlocks = useBlocksByDate(currentDate)
  const dateObj = parseISO(currentDate)

  const stats = useMemo(() => {
    const now = new Date()
    const completed = dayBlocks.filter((b) => b.completed)
    const missed = dayBlocks.filter((b) => !b.completed && b.endTime < format(now, "HH:mm"))
    const focusTime = dayBlocks.reduce((sum, b) => {
      const sessions = b.focusSessions ?? []
      return sum + sessions.reduce((s, fs) => s + fs.durationMinutes, 0)
    }, 0)
    return { completed, missed, focusTime, total: dayBlocks.length }
  }, [dayBlocks])

  const handleReschedule = useCallback(async (blockId: string) => {
    const tomorrow = addDays(parseISO(currentDate), 1)
    const tomorrowStr = formatDate(tomorrow)
    const block = blocks.find((b) => b.id === blockId)
    if (block) {
      block.date = tomorrowStr
      block.updatedAt = new Date().toISOString()
      await updateBlock(block)
    }
  }, [currentDate, blocks, updateBlock])

  const handleRescheduleAll = useCallback(async () => {
    for (const block of stats.missed) {
      await handleReschedule(block.id)
    }
  }, [stats.missed, handleReschedule])

  const prevDay = useCallback(() => {
    const prev = addDays(dateObj, -1)
    setSelectedDate(formatDate(prev))
    router.push(`/review?date=${formatDate(prev)}`)
  }, [dateObj, setSelectedDate, router])

  const nextDay = useCallback(() => {
    const next = addDays(dateObj, 1)
    setSelectedDate(formatDate(next))
    router.push(`/review?date=${formatDate(next)}`)
  }, [dateObj, setSelectedDate, router])

  const isPerfect = stats.total > 0 && stats.missed.length === 0
  const isEmpty = dayBlocks.length === 0

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={prevDay} className="p-1 rounded hover:bg-border text-text-secondary">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{formatDisplayDate(dateObj)}</h1>
            <button onClick={nextDay} className="p-1 rounded hover:bg-border text-text-secondary">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {isEmpty ? (
            <div className="text-center py-20">
              <p className="text-text-secondary">No blocks for this day</p>
              <p className="text-caption text-text-secondary mt-1">Start planning tomorrow!</p>
            </div>
          ) : (
            <>
              <div className="flex gap-3 justify-center">
                <StatCard value={stats.completed.length} label="Done" variant="positive" icon={CheckCircle2} />
                <StatCard value={stats.missed.length} label="Missed" variant="warning" icon={Circle} />
                <StatCard value={`${Math.round(stats.focusTime / 60)}h`} label="Focus" variant="primary" icon={Clock} />
              </div>

              {isPerfect && (
                <div className="text-center py-4 bg-success/10 rounded-radius-md">
                  <p className="text-success font-semibold">Perfect day!</p>
                  <p className="text-caption text-text-secondary">All blocks completed</p>
                </div>
              )}

              {stats.completed.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-text-secondary mb-2">Completed</h2>
                  <div className="space-y-1">
                    {stats.completed.map((b) => (
                      <div key={b.id} className="flex items-center gap-2 px-3 py-2 bg-surface rounded-radius-md border border-border opacity-60">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        <span className="font-mono text-time text-text-secondary">{b.startTime}</span>
                        <span className="text-sm line-through">{b.title}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {stats.missed.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-text-secondary mb-2">Missed</h2>
                  <div className="space-y-1">
                    {stats.missed.map((b) => (
                      <div key={b.id} className="flex items-center gap-2 px-3 py-2 bg-surface rounded-radius-md border border-border">
                        <Circle className="w-4 h-4 text-secondary shrink-0" />
                        <span className="font-mono text-time text-text-secondary">{b.startTime}</span>
                        <span className="text-sm flex-1">{b.title}</span>
                        <button
                          onClick={() => handleReschedule(b.id)}
                          className="p-1 rounded hover:bg-background text-text-secondary hover:text-primary transition-colors"
                          aria-label="Reschedule"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button variant="secondary" className="w-full mt-3" onClick={handleRescheduleAll}>
                    <Target className="w-4 h-4" /> Reschedule All Missed
                  </Button>
                </section>
              )}

              <p className="text-center text-caption text-text-secondary">
                {stats.completed.length >= 4 ? "Great focus today!" : stats.completed.length >= 2 ? "Good progress!" : "Keep going!"}
              </p>
            </>
          )}
        </div>
      </main>
      <BottomTab />
    </div>
  )
}

export default function ReviewPage() {
  return (
    <AuthGuard>
      <ReviewContent />
    </AuthGuard>
  )
}
