"use client"

import { memo } from "react"

interface DayCardProps {
  day: string
  date: number
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
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <button
      onClick={onTap}
      className={`flex flex-col gap-2 p-3 rounded-xl transition-all duration-200 w-full text-left ${
        isToday
          ? "border-2 border-[#5E6AD2] shadow-sm"
          : isEmpty
            ? "border-2 border-dashed border-white/[0.08] opacity-60"
            : "border border-white/[0.06]"
      } ${isPast && !isToday ? "opacity-60" : ""}`}
      style={{
        background: isToday
          ? "rgba(94,106,210,0.1)"
          : "linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs text-[#8A8F98] uppercase tracking-wide">{day}</span>
          <p className={`text-2xl font-bold leading-tight ${isToday ? "text-[#5E6AD2]" : "text-[#EDEDEF]"}`}>{date}</p>
        </div>
        {isToday && (
          <span className="bg-[#5E6AD2] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase leading-normal mt-1">
            Hari Ini
          </span>
        )}
      </div>

      {isEmpty ? (
        <p className="text-xs text-[#8A8F98] mt-1">Hari Istirahat</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {blockColors.slice(0, 8).map((color, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            ))}
            {blockColors.length > 8 && (
              <span className="text-xs text-[#8A8F98]">+{blockColors.length - 8}</span>
            )}
          </div>
          <div className="mt-auto">
            <div className="w-full bg-white/[0.08] h-1 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: "#5E6AD2" }}
              />
            </div>
            <p className="text-xs text-[#8A8F98] mt-1 font-medium">{completed}/{total} tugas</p>
          </div>
        </>
      )}
    </button>
  )
})
