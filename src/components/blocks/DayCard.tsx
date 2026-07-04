"use client"

import { memo } from "react"

interface DayCardProps {
  day: string
  date: number
  blockCount: number
  blockColors: string[]
  completed: number
  total: number
  isToday: boolean
  isPast: boolean
  onTap: () => void
}

export const DayCard = memo(function DayCard({
  day,
  date,
  blockColors,
  completed,
  total,
  isToday,
  isPast,
  onTap,
}: DayCardProps) {
  const isEmpty = total === 0

  return (
    <button
      onClick={onTap}
      className={`
        flex flex-col items-center gap-1.5 p-2.5 rounded-md transition-colors w-full
        border
        ${isToday
          ? "border-primary bg-primary/10"
          : "border-border bg-surface hover:bg-background"
        }
        ${isPast && !isToday ? "opacity-60" : ""}
      `}
    >
      <span className="text-xs text-text-secondary uppercase tracking-wide">{day}</span>
      <span className={`text-2xl font-bold ${isToday ? "text-primary" : ""}`}>{date}</span>
      {!isEmpty && (
        <span className="text-xs text-text-secondary tabular-nums mt-1">
          {completed}/{total}
        </span>
      )}
    </button>
  )
})
