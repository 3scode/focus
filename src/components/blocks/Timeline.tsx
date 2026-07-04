"use client"

import { useMemo, useCallback, useState, useRef } from "react"
import { Plus, Trash2 } from "lucide-react"
import { DndContext, useDraggable, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { TimeBlock } from "./TimeBlock"
import type { Block } from "@/types"
import { generateTimeSlots } from "@/lib/time"
import { TIMELINE_SLOT_HEIGHT } from "@/lib/constants"

const PX_PER_MIN = TIMELINE_SLOT_HEIGHT / 60

interface TimelineProps {
  blocks: Block[]
  categoryColors: Record<string, string>
  categoryNames: Record<string, string>
  dayStart: string
  dayEnd: string
  onBlockTap: (id: string) => void
  onSlotTap: (time: string) => void
  onTimerClick: (id: string) => void
  onDragEnd: (blockId: string, newStartTime: string) => void
  onDeleteBlock: (id: string) => void
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
      className={`flex-1 relative border-t border-border transition-colors ${isOver ? "bg-primary/10" : ""}`}
      style={{ minHeight: PX_PER_MIN * 30 }}
    >
      {!hasBlocks && (
        <button
          onClick={() => onTap(time)}
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-text-secondary hover:text-primary"
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
  categoryName,
  onTap,
  onTimerClick,
  onDelete,
}: {
  block: Block
  categoryColor: string
  categoryName: string
  onTap: (id: string) => void
  onTimerClick: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: { block, categoryColor },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined

  const [swiped, setSwiped] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  return (
    <div className="relative overflow-hidden h-full">
      <div className="absolute inset-y-0 right-0 flex items-center bg-error text-white px-3 rounded-radius-md">
        <button
          onClick={() => onDelete(block.id)}
          className="flex items-center gap-1 text-xs font-medium"
          aria-label="Delete block"
        >
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>

      <div
        ref={setNodeRef}
        style={{
          ...style,
          transform: swiped ? "translateX(-80px)" : style?.transform,
        }}
        className={`relative bg-surface transition-transform duration-200 h-full ${isDragging ? "opacity-30" : ""}`}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
          touchStartY.current = e.touches[0].clientY
        }}
        onTouchEnd={(e) => {
          const dx = touchStartX.current - e.changedTouches[0].clientX
          const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY)
          if (dx > 60 && dx > dy * 1.5) {
            setSwiped(true)
          } else if (swiped && dx < -30) {
            setSwiped(false)
          } else if (!swiped) {
            setSwiped(false)
          }
        }}
      >
        <TimeBlock
          block={block}
          categoryColor={categoryColor}
          categoryName={categoryName}
          onTap={onTap}
          onTimerClick={onTimerClick}
          dragListeners={listeners}
          dragAttributes={attributes}
        />
      </div>
    </div>
  )
}

export function Timeline({
  blocks,
  categoryColors,
  categoryNames,
  dayStart,
  dayEnd,
  onBlockTap,
  onSlotTap,
  onTimerClick,
  onDragEnd,
  onDeleteBlock,
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
      return {
        block,
        startMins,
        endMins,
        top: (startMins - dayStartMinutes) * PX_PER_MIN,
        height: Math.max(duration * PX_PER_MIN, PX_PER_MIN * 30),
      }
    }).sort((a, b) => a.startMins - b.startMins)

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
                <span className="font-mono text-time text-text-secondary tabular-nums">
                  {slot}
                </span>
              </div>

              <Slot time={slot} hasBlocks={hasBlocks} onTap={onSlotTap} />
            </div>
          )
        })}

        {blockLayout.map(({ block, top, height, column, numColumns }) => (
          <div
            key={block.id}
            className="absolute pointer-events-auto"
            style={{
              top: `${top}px`,
              height: `${height}px`,
              left: `calc(56px + ${column / numColumns} * (100% - 64px))`,
              width: `calc(${1 / numColumns} * (100% - 64px))`,
              minHeight: `${PX_PER_MIN * 30}px`,
            }}
          >
            <DraggableBlock
              block={block}
              categoryColor={categoryColors[block.categoryId] ?? "#6B7280"}
              categoryName={categoryNames[block.categoryId] ?? "Other"}
              onTap={onBlockTap}
              onTimerClick={onTimerClick}
              onDelete={onDeleteBlock}
            />
          </div>
        ))}
      </div>
    </DndContext>
  )
}
