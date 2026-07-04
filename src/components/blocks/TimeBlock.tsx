"use client"

import { memo } from "react"
import { GripVertical, CheckCircle2, Timer } from "lucide-react"
import type { Block } from "@/types"
import { formatDuration } from "@/lib/time"
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"
import type { DraggableAttributes } from "@dnd-kit/core"

interface TimeBlockProps {
  block: Block
  categoryColor: string
  categoryName: string
  onTap: (id: string) => void
  onTimerClick?: (id: string) => void
  compact?: boolean
  dragListeners?: SyntheticListenerMap
  dragAttributes?: DraggableAttributes
}
export const TimeBlock = memo(function TimeBlock({
  block,
  categoryColor,
  categoryName,
  onTap,
  onTimerClick,
  compact,
  dragListeners,
  dragAttributes,
}: TimeBlockProps) {
  return (
    <div
      className={`
        group relative flex items-start gap-2 p-3 rounded-radius-md border-l-[4px] h-full
        transition-all duration-150
        hover:brightness-95
        cursor-pointer active:scale-[0.98]
        text-white
        ${block.completed ? "opacity-60" : ""}
        ${compact ? "p-2" : ""}
      `}
      style={{
        borderLeftColor: categoryColor,
        backgroundColor: categoryColor,
      }}
      onClick={() => onTap(block.id)}
      role="button"
      aria-label={`Block: ${block.title}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onTap(block.id) }}
    >
      {!compact && dragListeners && (
        <div
          className="mt-0.5 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hover:text-white/90"
          {...dragListeners}
          {...dragAttributes}
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-time text-white/80 tabular-nums whitespace-nowrap">
            {block.startTime} — {block.endTime}
          </span>
          <span className="font-mono text-caption text-white/60 tabular-nums">
            {formatDuration(block.startTime, block.endTime)}
          </span>
          {block.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white/90" />}
          {!block.completed && onTimerClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onTimerClick(block.id) }}
              className="p-0.5 rounded hover:bg-white/20 text-white/70 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Start timer"
            >
              <Timer className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className={`text-sm font-medium text-white truncate ${block.completed ? "line-through" : ""}`}>
          {block.title}
        </p>
        {!compact && (
          <span className="text-caption text-white/70 capitalize">{categoryName}</span>
        )}
      </div>
    </div>
  )
})
