"use client"

import { Suspense, useState, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { addDays, subDays, format, parseISO } from "date-fns"
import { Timeline } from "@/components/blocks/Timeline"
import { Modal } from "@/components/ui/Modal"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { BlockForm } from "@/components/forms/BlockForm"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"
import { useBlocksByDate, useDailyProgress } from "@/hooks/useBlocks"
import { formatDisplayDate, generateRecurringBlocks } from "@/lib/time"
import type { Block } from "@/types"

function TodayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { categories, settings, selectedDate, setSelectedDate, addBlock, updateBlock, removeBlock, removeRecurringSeries, setActiveBlockId } = useApp()

  const dateParam = searchParams.get("date")
  const currentDate = useMemo(() => dateParam ? format(parseISO(dateParam), "yyyy-MM-dd") : selectedDate, [dateParam, selectedDate])

  const blocks = useBlocksByDate(currentDate)
  const { total, completed, percentage } = useDailyProgress(currentDate)

  const [showForm, setShowForm] = useState(false)
  const [editBlock, setEditBlock] = useState<Block | null>(null)
  const [preselectedTime, setPreselectedTime] = useState<string | undefined>()

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach((c) => { map[c.id] = c.color })
    return map
  }, [categories])

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach((c) => { map[c.id] = c.name })
    return map
  }, [categories])

  const handleSlotTap = useCallback((time: string) => {
    setPreselectedTime(time)
    setEditBlock(null)
    setShowForm(true)
  }, [])

  const handleBlockTap = useCallback((id: string) => {
    const block = blocks.find((b) => b.id === id)
    if (block) {
      setEditBlock(block)
      setPreselectedTime(undefined)
      setShowForm(true)
    }
  }, [blocks])

  const handleTimerClick = useCallback((id: string) => {
    setActiveBlockId(id)
    router.push("/timer")
  }, [router, setActiveBlockId])

  const handleDeleteBlock = useCallback(async (id: string) => {
    await removeBlock(id)
  }, [removeBlock])

  const handleDeleteSeries = useCallback(async (groupId: string) => {
    await removeRecurringSeries(groupId)
  }, [removeRecurringSeries])

  const handleDragEnd = useCallback(async (blockId: string, newStartTime: string) => {
    const block = blocks.find((b) => b.id === blockId)
    if (!block) return

    const duration = Math.round(
      (new Date(`2000-01-01T${block.endTime}`).getTime() -
        new Date(`2000-01-01T${block.startTime}`).getTime()) / 60000
    )

    const endDate = new Date(`2000-01-01T${newStartTime}`)
    endDate.setMinutes(endDate.getMinutes() + duration)
    const newEndTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`

    block.startTime = newStartTime
    block.endTime = newEndTime
    block.updatedAt = new Date().toISOString()
    await updateBlock(block)
  }, [blocks, updateBlock])

  const handleSubmit = useCallback(async (block: Block) => {
    if (editBlock) {
      await updateBlock(block)
    } else {
      if (block.recurring) {
        const blocks = generateRecurringBlocks(block)
        for (const b of blocks) {
          await addBlock(b)
        }
      } else {
        await addBlock(block)
      }
    }
    setShowForm(false)
    setEditBlock(null)
    setPreselectedTime(undefined)
  }, [editBlock, addBlock, updateBlock])

  const goToDate = useCallback((date: string) => {
    setSelectedDate(date)
    router.push(`/?date=${date}`)
  }, [router, setSelectedDate])

  const prevDay = useCallback(() => {
    const prev = subDays(parseISO(currentDate), 1)
    goToDate(format(prev, "yyyy-MM-dd"))
  }, [currentDate, goToDate])

  const nextDay = useCallback(() => {
    const next = addDays(parseISO(currentDate), 1)
    goToDate(format(next, "yyyy-MM-dd"))
  }, [currentDate, goToDate])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col pb-16 md:pb-0">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <button onClick={prevDay} className="p-1 rounded hover:bg-border text-text-secondary">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold">{formatDisplayDate(parseISO(currentDate))}</h1>
              <button onClick={nextDay} className="p-1 rounded hover:bg-border text-text-secondary">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-6">
          {blocks.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-text-secondary mb-2">No blocks yet</p>
              <p className="text-caption text-text-secondary mb-4">Plan your day by adding a time block</p>
              <button
                onClick={() => handleSlotTap("09:00")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-radius-md text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Block
              </button>
            </div>
          ) : (
            <>
              <Timeline
                blocks={blocks}
                categoryColors={colorMap}
                categoryNames={categoryNameMap}
                dayStart={settings.dayStart ?? "08:00"}
                dayEnd={settings.dayEnd ?? "18:00"}
                onBlockTap={handleBlockTap}
                onSlotTap={handleSlotTap}
                onTimerClick={handleTimerClick}
                onDragEnd={handleDragEnd}
                onDeleteBlock={handleDeleteBlock}
              />

              {total > 0 && (
                <div className="px-2">
                  <ProgressBar value={percentage} />
                  <p className="text-caption text-text-secondary mt-1">{completed}/{total} completed</p>
                </div>
              )}

              <button
                onClick={() => handleSlotTap("09:00")}
                className="fixed bottom-20 md:bottom-6 right-4 z-30 w-12 h-12 bg-primary text-white rounded-full shadow-lg
                  hover:bg-primary-hover transition-colors flex items-center justify-center"
                aria-label="Add block"
              >
                <Plus className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </main>
      <BottomTab />

      <Modal
        open={showForm}
        title={editBlock ? "Edit Block" : "New Block"}
        onClose={() => { setShowForm(false); setEditBlock(null); setPreselectedTime(undefined) }}
      >
        <BlockForm
          initialBlock={editBlock}
          preselectedTime={preselectedTime}
          selectedDate={currentDate}
          categories={categories}
          existingBlocks={blocks}
          onSubmit={handleSubmit}
          onDelete={handleDeleteBlock}
          onDeleteSeries={handleDeleteSeries}
          onClose={() => { setShowForm(false); setEditBlock(null); setPreselectedTime(undefined) }}
        />
      </Modal>
    </div>
  )
}

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-text-secondary">Loading...</div>}>
      <TodayContent />
    </Suspense>
  )
}
