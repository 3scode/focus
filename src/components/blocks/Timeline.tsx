"use client"

import { useMemo, useCallback } from "react"
import { Plus } from "lucide-react"
import { DndContext, useDraggable, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { TimeBlock } from "./TimeBlock"
import type { Block } from "@/types"
import { generateTimeSlots } from "@/lib/time"
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

function Slot({ time, hasBlocks, onTap }: { time: string; hasBlocks: boolean; onTap: (time: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${time}` })

  return (
    <div
      ref={setNodeRef}
      className="flex-1 relative transition-colors"
      style={{
        minHeight: PX_PER_MIN * 30,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: isOver ? "rgba(94,106,210,0.1)" : undefined,
      }}
    >
      {!hasBlocks && (
        <button
          onClick={() => onTap(time)}
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[#8A8F98] hover:text-[#5E6AD2]"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
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
  const totalMinutes = dayEndMinutes - dayStartMinutes

  const slots = useMemo(() => generateTimeSlots(dayStart, dayEnd, 30), [dayStart, dayEnd])

  const blockLayout = useMemo(() => {
    const items = blocks.map((block) => {
      const startMins = parseTime(block.startTime)
      const endMins = parseTime(block.endTime)
      const duration = endMins - startMins
      const naturalHeight = Math.max(duration * PX_PER_MIN, 20)
      return {
        block,
        startMins,
        endMins,
        duration,
        naturalHeight,
        top: (startMins - dayStartMinutes) * PX_PER_MIN,
        height: naturalHeight,
      }
    }).sort((a, b) => {
      const durA = a.endMins - a.startMins
      const durB = b.endMins - b.startMins
      if (durA !== durB) return durA - durB
      return a.startMins - b.startMins
    })

    const columns: (typeof items[number])[][] = []
    for (const item of items) {
      let placed = false
      for (let col = 0; col < columns.length; col++) {
        const last = columns[col][columns[col].length - 1]
        if (item.startMins >= last.endMins) {
          columns[col].push(item)
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([item])
      }
    }

    const columnMap = new Map<string, number>()
    for (let col = 0; col < columns.length; col++) {
      for (const item of columns[col]) {
        columnMap.set(item.block.id, col)
      }
    }

    const numCols = columns.length || 1

    return items.map((item) => ({
      ...item,
      column: columnMap.get(item.block.id) ?? 0,
      numColumns: numCols,
    }))
  }, [blocks, dayStartMinutes])

  const slotHasBlock = useMemo(() => {
    const set = new Map<string, boolean>()
    for (const slot of slots) {
      const slotStart = parseTime(slot)
      const slotEnd = slotStart + 30
      let found = false
      for (const { startMins, endMins } of blockLayout) {
        if (startMins < slotEnd && slotStart < endMins) {
          found = true
          break
        }
      }
      set.set(slot, found)
    }
    return set
  }, [slots, blockLayout])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || over.id === active.id) return

    const overId = over.id as string
    if (overId.startsWith("slot-")) {
      const newTime = overId.replace("slot-", "")
      onDragEnd(active.id as string, newTime)
    }
  }, [onDragEnd])

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="relative" style={{ height: totalMinutes * PX_PER_MIN }}>
        {slots.map((slot) => {
          const slotStart = parseTime(slot)
          const hasBlocks = slotHasBlock.get(slot) ?? false

          return (
            <div
              key={slot}
              className="absolute left-0 right-0 flex"
              style={{
                top: (slotStart - dayStartMinutes) * PX_PER_MIN,
                height: PX_PER_MIN * 30,
              }}
            >
              <div className="w-14 shrink-0 pt-1 text-right pr-3">
                <span className="font-mono text-xs text-[#8A8F98] tabular-nums">
                  {slot}
                </span>
              </div>

              <Slot time={slot} hasBlocks={hasBlocks} onTap={onSlotTap} />
            </div>
          )
        })}

        {blockLayout.map(({ block, top, height, column }) => (
          <div
            key={block.id}
            className="absolute pointer-events-auto"
            style={{
              top: `${top + column * 6}px`,
              height: `${Math.max(height - column * 6, 28)}px`,
              left: `56px`,
              width: `calc(100% - 64px)`,
              minHeight: `28px`,
              zIndex: 10 - column,
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
      </div>
    </DndContext>
  )
}
