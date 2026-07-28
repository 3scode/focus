"use client"

import { useMemo, useCallback } from "react"
import { DndContext, useDraggable, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { TimeBlock } from "./TimeBlock"
import type { Block } from "@/types"
import { TIMELINE_SLOT_HEIGHT } from "@/lib/constants"

const PX_PER_MIN = TIMELINE_SLOT_HEIGHT / 60

interface TimelineProps {
  blocks: Block[]
  categoryColors: Record<string, string>
  dayStart: string
  dayEnd: string
  onBlockTap: (id: string) => void
  onSlotTap: (time: string) => void
  onTimerClick: (id: string) => void
  onDragEnd: (blockId: string, newStartTime: string) => void
}

function parseTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function formatTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function TimeMarker({ time, mins, startMinutes, isBlock }: { time: string; mins: number; startMinutes: number; isBlock?: boolean }) {
  const textClass = isBlock ? "text-[10px] text-[#5A5E66]" : "text-xs text-[#8A8F98]"
  return (
    <div
      className="absolute left-0 right-0 flex"
      style={{
        top: (mins - startMinutes) * PX_PER_MIN,
        height: 1,
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="w-14 shrink-0 -translate-y-1/2 text-right pr-3">
        <span className={`font-mono tabular-nums ${textClass}`}>
          {time}
        </span>
      </div>
      <div className="flex-1" />
    </div>
  )
}

function TimelineDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "timeline-drop" })

  return (
    <div
      ref={setNodeRef}
      className={`relative flex-1 transition-colors ${isOver ? "bg-[rgba(94,106,210,0.08)]" : ""}`}
    >
      {children}
    </div>
  )
}

function DraggableBlock({
  block,
  categoryColor,
  onTap,
  onTimerClick,
}: {
  block: Block
  categoryColor: string
  onTap: (id: string) => void
  onTimerClick: (id: string) => void
}) {
  const { setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: { block, categoryColor },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative transition-transform duration-200 h-full ${isDragging ? "opacity-30" : ""}`}
    >
      <TimeBlock
        block={block}
        categoryColor={categoryColor}
        onTap={onTap}
        onTimerClick={onTimerClick}
      />
    </div>
  )
}

export function Timeline({
  blocks,
  categoryColors,
  dayStart,
  dayEnd,
  onBlockTap,
  onSlotTap,
  onTimerClick,
  onDragEnd,
}: TimelineProps) {
  const dayStartMinutes = useMemo(() => parseTime(dayStart), [dayStart])
  const dayEndMinutes = useMemo(() => parseTime(dayEnd), [dayEnd])

  const effectiveStartMinutes = useMemo(() => {
    if (blocks.length === 0) return dayStartMinutes
    const earliest = Math.min(...blocks.map(b => parseTime(b.startTime)))
    const raw = Math.min(dayStartMinutes, earliest)
    return raw - (raw % 30)
  }, [dayStartMinutes, blocks])

  const effectiveEndMinutes = useMemo(() => {
    if (blocks.length === 0) return dayEndMinutes
    const latest = Math.max(...blocks.map(b => parseTime(b.endTime)))
    const raw = Math.max(dayEndMinutes, latest)
    return raw + (raw % 30 === 0 ? 0 : 30 - raw % 30)
  }, [dayEndMinutes, blocks])

  const totalMinutes = effectiveEndMinutes - effectiveStartMinutes

  const markers = useMemo(() => {
    const seen = new Set<number>()
    const result: { time: string; mins: number; isBlock: boolean }[] = []

    for (let m = effectiveStartMinutes + (effectiveStartMinutes % 30 === 0 ? 0 : 30 - effectiveStartMinutes % 30); m <= effectiveEndMinutes; m += 30) {
      const h = Math.floor(m / 60)
      const min = m % 60
      if (!seen.has(m)) {
        seen.add(m)
        result.push({ time: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`, mins: m, isBlock: false })
      }
    }

    result.sort((a, b) => a.mins - b.mins)
    return result
  }, [effectiveStartMinutes, effectiveEndMinutes])

  const blockLayout = useMemo(() =>
    blocks.map((block) => {
      const startMins = parseTime(block.startTime)
      const endMins = parseTime(block.endTime)
      return {
        block,
        top: (startMins - effectiveStartMinutes) * PX_PER_MIN,
        height: (endMins - startMins) * PX_PER_MIN,
      }
    }).sort((a, b) => a.top - b.top),
  [blocks, effectiveStartMinutes])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event
    if (!over) return

    const block = active.data.current?.block as Block | undefined
    if (!block) return

    const origMins = parseTime(block.startTime)
    const newMins = Math.round((origMins + delta.y / PX_PER_MIN) / 5) * 5
    const clamped = Math.max(effectiveStartMinutes, Math.min(newMins, effectiveEndMinutes - 5))
    onDragEnd(block.id, formatTime(clamped))
  }, [onDragEnd, effectiveStartMinutes, effectiveEndMinutes])

  const handleTimelineTap = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    let mins = Math.round((y / PX_PER_MIN + effectiveStartMinutes) / 5) * 5
    mins = Math.max(effectiveStartMinutes, Math.min(mins, effectiveEndMinutes - 30))
    onSlotTap(formatTime(mins))
  }, [effectiveStartMinutes, effectiveEndMinutes, onSlotTap])

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="relative" style={{ height: totalMinutes * PX_PER_MIN }}>
        {markers.map((m) => (
          <TimeMarker key={m.mins} {...m} startMinutes={effectiveStartMinutes} />
        ))}

        <div
          className="absolute left-14 right-0 top-0 bottom-0 cursor-pointer"
          onClick={handleTimelineTap}
        >
          <TimelineDropZone>
            {blockLayout.map(({ block, top, height }) => (
              <div
                key={block.id}
                className="absolute pointer-events-auto"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `0px`,
                  width: `calc(100% - 8px)`,
                }}
              >
                <DraggableBlock
                  block={block}
                  categoryColor={block.color ?? categoryColors[block.categoryId] ?? "#6B7280"}
                  onTap={onBlockTap}
                  onTimerClick={onTimerClick}
                />
              </div>
            ))}
          </TimelineDropZone>
        </div>
      </div>
    </DndContext>
  )
}
