"use client"

import { useMemo } from "react"
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"
import { DayCard } from "./DayCard"
import { getWeekDays, isToday, format, formatDuration } from "@/lib/time"
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
}

export function WeekGrid({
  currentDate,
  blocks,
  categories,
  onPrevWeek,
  onNextWeek,
  onToday,
  onDayTap,
}: WeekGridProps) {
  const days = useMemo(() => getWeekDays(currentDate), [currentDate])

  const dayData = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c.color]))
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      const dayBlocks = blocks.filter((b) => b.date === dateStr)
      const total = dayBlocks.length
      const completed = dayBlocks.filter((b) => b.completed).length
      const blockColors = dayBlocks.map((b) => catMap.get(b.categoryId) ?? "#6B7280")
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
          <h3 className="text-sm font-semibold text-text-secondary">All Blocks This Week</h3>
          <div className="space-y-2">
            {dayData.flatMap((d) =>
              d.blocks.map((block) => (
                <div
                  key={block.id}
                  className={`
                    p-3 rounded-radius-md cursor-pointer hover:brightness-95 transition-all
                    ${block.completed ? "opacity-70" : ""}
                  `}
                  style={{ backgroundColor: categoryColors[block.categoryId] ?? "#6B7280", color: "white" }}
                  onClick={() => onDayTap(d.date)}
                >
                  <div className="flex items-center gap-2 text-xs opacity-80">
                    <span className="font-mono">{format(d.date, "EEE, MMM d")}</span>
                    <span>•</span>
                    <span className="font-mono">{block.startTime} — {block.endTime}</span>
                    <span className="font-mono opacity-60">{formatDuration(block.startTime, block.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {block.completed && <CheckCircle2 className="w-4 h-4" />}
                    <div className={`font-medium ${block.completed ? "line-through" : ""}`}>{block.title}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
