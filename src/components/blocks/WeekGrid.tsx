"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
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

  const dayData = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c.color]))
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      const dayBlocks = blocks.filter((b) => b.date === dateStr)
      const total = dayBlocks.length
      const completed = dayBlocks.filter((b) => b.completed).length
      const blockColors = dayBlocks.map((b) => b.color ?? catMap.get(b.categoryId) ?? "#6B7280")
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
  }, [days, blocks, categories])

  const categoryColors = useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach((c) => { map[c.id] = c.color })
    return map
  }, [categories])

  const totalBlocks = dayData.reduce((s, d) => s + d.total, 0)
  const totalCompleted = dayData.reduce((s, d) => s + d.completed, 0)

  const handleToggleComplete = (block: Block) => {
    const taskDurationMins = calcDuration(block.startTime, block.endTime)
    const totalFocusMins = block.focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0)

    if (!block.completed && totalFocusMins < taskDurationMins) {
      setConfirmBlock(block)
      return
    }

    onToggleComplete(block.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onPrevWeek} className="p-1.5 rounded-radius-md hover:bg-background text-text-secondary" aria-label="Previous week">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button onClick={onNextWeek} className="p-1.5 rounded-radius-md hover:bg-background text-text-secondary" aria-label="Next week">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button onClick={onToday} className="text-sm text-primary hover:underline">Today</button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayData.map((d) => (
          <DayCard
            key={d.date.toISOString()}
            day={d.dayName}
            date={d.dateNum}
            blockCount={d.total}
            blockColors={d.blockColors}
            completed={d.completed}
            total={d.total}
            isToday={d.today}
            isPast={d.past}
            onTap={() => onDayTap(d.date)}
          />
        ))}
      </div>

      <div className="flex gap-4 text-caption text-text-secondary">
        <span>Total blocks: {totalBlocks}</span>
        <span>Completed: {totalCompleted}</span>
      </div>

      {totalBlocks > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-secondary">All Blocks This Week</h3>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-2 py-1 text-xs rounded-md font-medium bg-primary text-white transition-colors"
            >
              Time {sortAsc ? "↑" : "↓"}
            </button>
          </div>

          {(() => {
            const sorted = dayData.flatMap((d) =>
              d.blocks.map((block) => ({ block, day: d.date }))
            )
            sorted.sort((a, b) => {
              const diff = a.day.getTime() - b.day.getTime() || parseTime(a.block.startTime) - parseTime(b.block.startTime)
              return sortAsc ? diff : -diff
            })

            return (
              <div className="space-y-1">
                {sorted.map(({ block, day }) => {
                  const color = block.color ?? categoryColors[block.categoryId] ?? "#6B7280"
                  const isMissed = block.missed && !block.completed
                  return (
                    <div
                      key={block.id}
                      className={`
                        flex items-center gap-1.5 p-1.5 rounded-radius-md transition-all
                        ${block.completed ? "opacity-70" : ""}
                        ${isMissed ? "opacity-50" : ""}
                      `}
                      style={{ backgroundColor: color, color: "white" }}
                    >
                      {!block.completed && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleMissed(block.id) }}
                          className="shrink-0 text-sm leading-none"
                          aria-label={isMissed ? "Mark pending" : "Mark missed"}
                        >
                          ✕
                        </button>
                      )}
                      {!isMissed && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleComplete(block) }}
                          className="shrink-0 text-sm leading-none"
                          aria-label={block.completed ? "Mark incomplete" : "Mark complete"}
                        >
                          ✓
                        </button>
                      )}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onDayTap(day)}
                      >
                        <div className="flex items-center gap-1 text-xs opacity-80">
                          <span className="font-mono">{format(day, "EEE, MMM d")}</span>
                          <span>•</span>
                          <span className="font-mono">{block.startTime}—{block.endTime}</span>
                          <span className="font-mono opacity-60">{formatDuration(block.startTime, block.endTime)}</span>
                        </div>
                        <div className={`text-xs font-medium truncate ${block.completed ? "line-through" : ""}`}>{block.title}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
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
