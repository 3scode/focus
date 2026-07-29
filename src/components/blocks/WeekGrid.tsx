"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Timer, CheckCircle2, TrendingUp } from "lucide-react"
import { DayCard } from "./DayCard"
import { getWeekDays, isToday, format, formatDuration, calcDuration } from "@/lib/time"
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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
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

  const selectedDayBlocks = useMemo(() => {
    if (!selectedDay) return []
    const dateStr = format(selectedDay, "yyyy-MM-dd")
    return blocks.filter((b) => b.date === dateStr)
  }, [selectedDay, blocks])

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
            onTap={() => setSelectedDay(d.date)}
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

      {selectedDay && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#8A8F98]">
              {format(selectedDay, "EEEE, d MMMM yyyy")}
            </h3>
            <button
              onClick={() => onDayTap(selectedDay)}
              className="text-xs font-medium text-[#5E6AD2] hover:underline transition-colors"
            >
              Lihat di Today →
            </button>
          </div>
          {selectedDayBlocks.length === 0 ? (
            <p className="text-sm text-[#8A8F98] py-8 text-center">Tidak ada blok di hari ini</p>
          ) : (
            <div className="space-y-2">
              {selectedDayBlocks.map((block) => {
                const color = block.color ?? catMap[block.categoryId] ?? "#6B7280"
                const cat = categories.find((c) => c.id === block.categoryId)
                const scheduled = calcDuration(block.startTime, block.endTime)
                const focusMins = block.focusSessions.reduce((s, fs) => s + fs.durationMinutes, 0)
                const progress = scheduled > 0 ? Math.min(100, Math.round((focusMins / scheduled) * 100)) : 0

                return (
                  <div
                    key={block.id}
                    className="flex items-stretch gap-0 rounded-xl overflow-hidden transition-all"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                      border: "1px solid rgba(255,255,255,0.06)",
                      opacity: block.completed ? 0.7 : 1,
                    }}
                  >
                    <div className="w-1 shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold truncate ${block.completed ? "text-[#8A8F98] line-through" : "text-[#EDEDEF]"}`}>
                          {block.title}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ background: `${color}20`, color }}>
                          {cat?.name ?? "?"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-[#8A8F98]">{block.startTime} — {block.endTime}</span>
                        <span className="text-[#5A5E66]">·</span>
                        <span className="text-[11px] text-[#5A5E66]">{formatDuration(block.startTime, block.endTime)}</span>
                        {focusMins > 0 && (
                          <>
                            <span className="text-[#5A5E66]">·</span>
                            <span className="text-[11px] text-[#5E6AD2] flex items-center gap-1">
                              <Timer className="w-3 h-3" /> {focusMins}m
                            </span>
                          </>
                        )}
                      </div>
                      {focusMins > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${progress}%`,
                                  background: block.completed
                                    ? "linear-gradient(90deg, #22C55E, #16A34A)"
                                    : progress >= 100
                                      ? "linear-gradient(90deg, #F59E0B, #D97706)"
                                      : "linear-gradient(90deg, #5E6AD2, #818CF8)",
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-medium tabular-nums text-[#8A8F98]">{focusMins}m / {scheduled}m</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>  
  )
}
