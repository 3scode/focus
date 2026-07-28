"use client"

import { memo } from "react"
import { CheckCircle2, Timer } from "lucide-react"
import type { Block } from "@/types"
import { formatDuration } from "@/lib/time"

interface TimeBlockProps {
  block: Block
  categoryColor: string
  onTap: (id: string) => void
  onTimerClick?: (id: string) => void
}

export const TimeBlock = memo(function TimeBlock({
  block,
  categoryColor,
  onTap,
  onTimerClick,
}: TimeBlockProps) {
  return (
    <div
      className="group relative flex items-center gap-1.5 px-2 py-1 h-full cursor-pointer active:scale-[0.98] transition-all duration-200 text-white rounded-lg"
      style={{
        borderLeft: `3px solid ${categoryColor}`,
        background: `linear-gradient(to right, ${categoryColor}40, ${categoryColor}20)`,
      }}
      onClick={(e) => { e.stopPropagation(); onTap(block.id) }}
      role="button"
      aria-label={`Block: ${block.title}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onTap(block.id) } }}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {block.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white/90 shrink-0" />}
        <span className="font-mono text-xs text-white/80 tabular-nums whitespace-nowrap shrink-0">
          {block.startTime}—{block.endTime}
        </span>
        <span className="text-white/40 shrink-0">·</span>
        <p className={`text-sm font-medium text-white truncate min-w-0 ${block.completed ? "line-through opacity-70" : ""}`}>
          {block.title}
        </p>
        <span className="font-mono text-xs text-white/60 tabular-nums shrink-0">
          {formatDuration(block.startTime, block.endTime)}
        </span>
        {!block.completed && onTimerClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onTimerClick(block.id) }}
            className="p-0.5 rounded hover:bg-white/20 text-white/70 opacity-60 hover:opacity-100 transition-colors shrink-0"
            aria-label="Start timer"
          >
            <Timer className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
})
