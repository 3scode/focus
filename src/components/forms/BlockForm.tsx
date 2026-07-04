"use client"

import { useState, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"
import { Clock, Trash2, Repeat } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import type { Block, Category } from "@/types"
import { calcDuration, calcEndTime } from "@/lib/time"

interface BlockFormProps {
  initialBlock?: Block | null
  preselectedTime?: string
  selectedDate: string
  categories: Category[]
  existingBlocks: Block[]
  onSubmit: (block: Block) => void
  onClose: () => void
  onDelete?: (id: string) => void
  onDeleteSeries?: (groupId: string) => void
}

const COLOR_OPTIONS = [
  "#3B82F6", "#10B981", "#F43F5E", "#8B5CF6",
  "#F59E0B", "#6B7280", "#EF4444", "#22C55E",
  "#14B8A6", "#6366F1", "#EC4899", "#F97316",
]

export function BlockForm({
  initialBlock,
  preselectedTime,
  selectedDate,
  categories,
  existingBlocks,
  onSubmit,
  onClose,
  onDelete,
  onDeleteSeries,
}: BlockFormProps) {
  const initialStart = initialBlock?.startTime ?? preselectedTime ?? "09:00"
  const initialEnd = initialBlock?.endTime ?? calcEndTime(initialStart, 60)

  const [title, setTitle] = useState(initialBlock?.title ?? "")
  const [startTime, setStartTime] = useState(initialStart)
  const [endTime, setEndTime] = useState(initialEnd)
  const [categoryId, setCategoryId] = useState(initialBlock?.categoryId ?? categories[0]?.id ?? "other")
  const [blockColor, setBlockColor] = useState(initialBlock?.color ?? "")
  const [isRecurring, setIsRecurring] = useState(initialBlock?.recurring ?? false)
  const [recurringPattern, setRecurringPattern] = useState(initialBlock?.recurringPattern ?? "daily")
  const [recurringStartDate, setRecurringStartDate] = useState(initialBlock?.recurringStartDate ?? selectedDate)
  const [recurringEndDate, setRecurringEndDate] = useState(initialBlock?.recurringEndDate ?? "")
  const [error, setError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const duration = calcDuration(startTime, endTime)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Title is required")
      return
    }
    if (startTime >= endTime) {
      setError("End time must be after start time")
      return
    }
    if (duration < 15) {
      setError("Minimum duration is 15 minutes")
      return
    }

    const now = new Date().toISOString()
    const block: Block = {
      id: initialBlock?.id ?? uuidv4(),
      title: title.trim(),
      date: selectedDate,
      startTime,
      endTime,
      categoryId,
      color: blockColor || undefined,
      completed: initialBlock?.completed ?? false,
      focusSessions: initialBlock?.focusSessions ?? [],
      createdAt: initialBlock?.createdAt ?? now,
      updatedAt: now,
      recurring: isRecurring,
      recurringPattern: isRecurring ? recurringPattern : undefined,
      recurringStartDate: isRecurring ? recurringStartDate : undefined,
      recurringEndDate: isRecurring ? recurringEndDate : undefined,
      recurringGroupId: initialBlock?.recurringGroupId ?? (isRecurring ? uuidv4() : undefined),
    }
    onSubmit(block)
  }

  const handleDelete = () => {
    if (!initialBlock || !onDelete) return

    if (initialBlock.recurringGroupId) {
      setShowDeleteConfirm(true)
    } else {
      onDelete(initialBlock.id)
      onClose()
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you working on?"
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary
            placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            text-base transition-shadow"
          autoFocus
        />
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border">
        <Clock className="w-5 h-5 text-text-secondary shrink-0" />
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary
                focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary
                focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-sm"
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-text-secondary">Duration</div>
          <div className="text-sm font-semibold tabular-nums">{duration}m</div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => {
            const selected = categoryId === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150
                  ${selected
                    ? "text-white border-transparent shadow-sm"
                    : "bg-background border-border text-text-secondary hover:border-text-secondary/30"
                  }
                `}
                style={selected ? { backgroundColor: cat.color } : undefined}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selected ? "white" : cat.color }}
                />
                <span className="truncate">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBlockColor("")}
            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center text-xs font-medium
              ${!blockColor ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border"}`}
            style={{ backgroundColor: "transparent" }}
            title="Auto (category)"
          >
            <span className="text-text-secondary text-[10px] font-bold">A</span>
          </button>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setBlockColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                ${blockColor === c ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-background border border-border">
        <div className="flex items-center gap-3">
          <Repeat className="w-5 h-5 text-text-secondary" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary/30"
            />
            <span className="text-sm font-medium">Repeat this block</span>
          </label>
        </div>
        {isRecurring && (
          <div className="mt-4 pl-8 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Repeats</label>
              <select
                value={recurringPattern}
                onChange={(e) => setRecurringPattern(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Starting from</label>
              <input
                type="date"
                value={recurringStartDate}
                onChange={(e) => setRecurringStartDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Until</label>
              <input
                type="date"
                value={recurringEndDate}
                onChange={(e) => setRecurringEndDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-error/10 border border-error/20">
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        {initialBlock && onDelete && (
          <Button type="button" variant="ghost" className="text-error hover:text-error hover:bg-error/10 px-2" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {initialBlock ? "Update" : "Save Block"}
        </Button>
      </div>
    </form>
    <Modal open={showDeleteConfirm} title="Delete Recurring Block" onClose={() => setShowDeleteConfirm(false)}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">This is a recurring block. What would you like to delete?</p>
        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              if (initialBlock && onDelete) {
                onDelete(initialBlock.id)
              }
              onClose()
            }}
          >
            Delete this block only
          </Button>
          <Button
            variant="ghost"
            className="w-full text-error hover:text-error hover:bg-error/10"
            onClick={() => {
              if (initialBlock?.recurringGroupId && onDeleteSeries) {
                onDeleteSeries(initialBlock.recurringGroupId)
              }
              onClose()
            }}
          >
            Delete this and all future blocks
          </Button>
        </div>
        </div>
      </Modal>
    </>
  )
}
