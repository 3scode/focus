"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Timer, CheckCircle2, TrendingUp } from "lucide-react"
import { DayCard } from "./DayCard"
import { getWeekDays, isToday, format, formatDuration, calcDuration } from "@/lib/time"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import type { Block } from "@/types"
import type { Category } from "@/types"

interface WeekGridProps {
  currentDate: Date
  blocks: Block[]
  categories: Category[]
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
  onDayTap: (date: Date) => void
  onToggleComplete: (id: string, confirmed?: boolean) => void
  onToggleMissed: (id: string) => void
}

function parseTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export function WeekGrid({
  currentDate,
  blocks,
  categories,
  onPrevWeek,
  onNextWeek,
  onToday,
  onDayTap,
  onToggleComplete,
  onToggleMissed,
}: WeekGridProps) {
  const [sortAsc, setSortAsc] = useState(true)
  const [confirmBlock, setConfirmBlock] = useState<Block | null>(null)
  const days = useMemo(() => getWeekDays(currentDate), [currentDate])

  const catMap = useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach((c) => { map[c.id] = c.color })
    return map
  }, [categories])

  const dayData = useMemo(() => {
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      const dayBlocks = blocks.filter((b) => b.date === dateStr)
      const total = dayBlocks.length
      const completed = dayBlocks.filter((b) => b.completed).length
      const blockColors = dayBlocks.map((b) => b.color ?? catMap[b.categoryId] ?? "#6B7280")
      return {
        date: day,
        dayName: format(day, "EEE"),
        dateNum: day.getDate(),
        blocks: dayBlocks,
        blockColors,
        completed,
        total,
        today: isToday(day),
        past: day < new Date(new Date().toDateString()),
      }
    })
  }, [days, blocks, catMap])

  const totalBlocks = dayData.reduce((s, d) => s + d.total, 0)
  const totalCompleted = dayData.reduce((s, d) => s + d.completed, 0)
  const totalFocusMins = blocks.reduce((sum, b) =>
    sum + b.focusSessions.reduce((s, f) => s + f.durationMinutes, 0), 0)
  const efficiency = totalBlocks > 0 ? Math.round((totalCompleted / totalBlocks) * 100) : 0

  const weekLabel = useMemo(() => {
    const start = days[0]
    const end = days[6]
    return `${format(start, "d MMM")} — ${format(end, "d MMM yyyy")}`
  }, [days])

  const allWeekBlocks = useMemo(() => {
    const sorted = dayData.flatMap((d) =>
      d.blocks.map((block) => ({ block, day: d.date }))
    )
    sorted.sort((a, b) => {
      const diff = a.day.getTime() - b.day.getTime() || parseTime(a.block.startTime) - parseTime(b.block.startTime)
      return sortAsc ? diff : -diff
    })
    return sorted
  }, [dayData, sortAsc])

  const handleToggleComplete = (block: Block) => {
    const taskDurationMins = calcDuration(block.startTime, block.endTime)
    const totalFocusMins = block.focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0)

    if (!block.completed && totalFocusMins < taskDurationMins) {
      setConfirmBlock(block)
      return
    }

    onToggleComplete(block.id)
  }

  const formatFocusTime = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}j ${m}m` : `${m}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onPrevWeek} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#8A8F98] transition-colors" aria-label="Previous week">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-[#EDEDEF]">{format(currentDate, "MMMM yyyy")}</h1>
          <button onClick={onNextWeek} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#8A8F98] transition-colors" aria-label="Next week">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onToday}
            className="ml-1 px-3 py-1 text-xs font-semibold rounded-lg bg-white/[0.08] text-[#8A8F98] hover:bg-white/[0.12] transition-colors"
          >
            Hari Ini
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayData.map((d) => (
          <DayCard
            key={d.date.toISOString()}
            day={d.dayName}
            date={d.dateNum}
            blockColors={d.blockColors}
            completed={d.completed}
            total={d.total}
            isToday={d.today}
            isPast={d.past}
            onTap={() => onDayTap(d.date)}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
          <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#5E6AD2]" />
          </div>
          <div>
            <p className="text-xs text-[#8A8F98]">Total Blok</p>
            <p className="text-lg font-bold text-[#EDEDEF]">{totalCompleted}/{totalBlocks}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
          <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center">
            <Timer className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-xs text-[#8A8F98]">Waktu Fokus</p>
            <p className="text-lg font-bold text-[#EDEDEF]">{formatFocusTime(totalFocusMins)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <p className="text-xs text-[#8A8F98]">Efisiensi</p>
            <p className="text-lg font-bold text-[#EDEDEF]">{efficiency}%</p>
          </div>
        </div>
      </div>

      {allWeekBlocks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#8A8F98]">All Blocks — {weekLabel}</h3>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#5E6AD2] text-white transition-colors hover:bg-[#5E6AD2]/80"
            >
              Time {sortAsc ? "↑" : "↓"}
            </button>
          </div>

          <div className="space-y-1">
            {allWeekBlocks.map(({ block, day }) => {
              const color = block.color ?? catMap[block.categoryId] ?? "#6B7280"
              const isMissed = block.missed && !block.completed
              return (
                <div
                  key={block.id}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all hover:brightness-110 ${block.completed ? "opacity-70" : ""} ${isMissed ? "opacity-50" : ""}`}
                  style={{ backgroundColor: color, color: "white" }}
                >
                  {!block.completed && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleMissed(block.id) }}
                      className="shrink-0 text-sm leading-none opacity-80 hover:opacity-100"
                      aria-label={isMissed ? "Mark pending" : "Mark missed"}
                    >
                      ✕
                    </button>
                  )}
                  {!isMissed && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleComplete(block) }}
                      className="shrink-0 text-sm leading-none opacity-80 hover:opacity-100"
                      aria-label={block.completed ? "Mark incomplete" : "Mark complete"}
                    >
                      ✓
                    </button>
                  )}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onDayTap(day)}
                  >
                    <div className="flex items-center gap-1.5 text-xs opacity-80 flex-wrap">
                      <span className="font-medium">{format(day, "EEE, MMM d")}</span>
                      <span>•</span>
                      <span className="font-mono">{block.startTime}—{block.endTime}</span>
                      <span className="font-mono opacity-60">{formatDuration(block.startTime, block.endTime)}</span>
                    </div>
                    <div className={`text-sm font-medium truncate ${block.completed ? "line-through" : ""}`}>{block.title}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmBlock !== null}
        title="Konfirmasi selesai"
        message={
          confirmBlock
            ? (() => {
                const taskDurationMins = calcDuration(confirmBlock.startTime, confirmBlock.endTime)
                const totalFocusMins = confirmBlock.focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
                const progressPercent = Math.round((totalFocusMins / taskDurationMins) * 100)
                return `Task "${confirmBlock.title}" belum selesai! Progress: ${progressPercent}% (${totalFocusMins}/${taskDurationMins} menit)\n\nYakin ingin menandai selesai?`
              })()
            : ""
        }
        onConfirm={() => {
          if (confirmBlock) onToggleComplete(confirmBlock.id, true)
          setConfirmBlock(null)
        }}
        onCancel={() => setConfirmBlock(null)}
      />
    </div>
  )
}
