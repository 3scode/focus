"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { addDays } from "date-fns/addDays"
import { subDays } from "date-fns/subDays"
import { format } from "date-fns/format"
import { parseISO } from "date-fns/parseISO"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Timeline } from "@/components/blocks/Timeline"
import { Modal } from "@/components/ui/Modal"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { BlockForm } from "@/components/forms/BlockForm"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"
import { useBlocksByDate, useDailyProgress } from "@/hooks/useBlocks"
import { formatDisplayDate, generateRecurringBlocks } from "@/lib/time"
import type { Block } from "@/types"
import * as api from "@/lib/api"

function TodayContent() {
  const router = useRouter()
  const { categories, settings, selectedDate, setSelectedDate, addBlock, updateBlock, removeBlock, removeRecurringSeries, setActiveBlockId, addHabit: storeAddHabit } = useApp()

  const currentDate = selectedDate

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
      if (block.recurring && block.recurringGroupId) {
        // Regenerate series dengan pengaturan baru
        const allBlocks = await api.getBlocks()
        const oldSeries = allBlocks.filter((b) => b.recurringGroupId === block.recurringGroupId && b.id !== block.id)
        for (const b of oldSeries) {
          await removeBlock(b.id, true)
        }
        const generated = generateRecurringBlocks(block)
        for (const b of generated) {
          if (b.date !== block.date) {
            await addBlock(b, true)
          }
        }
      } else if (editBlock.recurring && editBlock.recurringGroupId && !block.recurring) {
        // Recurring dimatikan → hapus semua block dari series
        const allBlocks = await api.getBlocks()
        const oldSeries = allBlocks.filter((b) => b.recurringGroupId === editBlock.recurringGroupId && b.id !== block.id)
        for (const b of oldSeries) {
          await removeBlock(b.id, true)
        }
      }
    } else {
      if (block.recurring) {
        await addBlock(block)
        const generated = generateRecurringBlocks(block)
        for (const b of generated) {
          if (b.date !== block.date) {
            await addBlock(b, true)
          }
        }
      } else {
        await addBlock(block)
      }
    }
    setShowForm(false)
    setEditBlock(null)
    setPreselectedTime(undefined)
  }, [editBlock, addBlock, updateBlock, removeBlock])

  const goToDate = useCallback((date: string) => {
    setSelectedDate(date)
  }, [setSelectedDate])

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
        <header
          className="sticky top-0 z-10 px-4 py-3"
          style={{ background: "rgba(5,5,6,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <button onClick={prevDay} className="p-1 rounded-lg hover:bg-white/[0.05] text-[#8A8F98]">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold text-[#EDEDEF]">{formatDisplayDate(parseISO(currentDate))}</h1>
              <button onClick={nextDay} className="p-1 rounded-lg hover:bg-white/[0.05] text-[#8A8F98]">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 max-w-3xl lg:max-w-4xl xl:max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {blocks.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[#8A8F98] mb-2">No blocks yet</p>
              <p className="text-xs text-[#8A8F98] mb-4">Plan your day by adding a time block</p>
              <button
                onClick={() => handleSlotTap("09:00")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#5E6AD2] text-white rounded-lg text-sm font-medium hover:bg-[#6872D9] transition-colors shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
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
                dayStart={settings.dayStart ?? "08:00"}
                dayEnd={settings.dayEnd ?? "18:00"}
                onBlockTap={handleBlockTap}
                onSlotTap={handleSlotTap}
                onTimerClick={handleTimerClick}
                onDragEnd={handleDragEnd}
              />

              {total > 0 && (
                <div className="px-2">
                  <ProgressBar value={percentage} />
                  <p className="text-xs text-[#8A8F98] mt-1">{completed}/{total} completed</p>
                </div>
              )}

              <button
                onClick={() => handleSlotTap("09:00")}
                className="fixed bottom-20 md:bottom-6 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
                style={{
                  background: "linear-gradient(to bottom, #5E6AD2, #4F5BCF)",
                  boxShadow: "0 0 0 1px rgba(94,106,210,0.5), 0 4px 20px rgba(94,106,210,0.4), inset 0 1px 0 0 rgba(255,255,255,0.2)",
                }}
                aria-label="Add block"
              >
                <Plus className="w-6 h-6 text-white" />
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
          onSubmit={handleSubmit}
          onDelete={handleDeleteBlock}
          onDeleteSeries={handleDeleteSeries}
          onConvertToHabit={async (name, color) => {
            const newHabit = {
              id: uuidv4(),
              name,
              color,
              frequency: "daily" as const,
              order: 0,
              createdAt: new Date().toISOString(),
            }
            await storeAddHabit(newHabit)
          }}
          onClose={() => { setShowForm(false); setEditBlock(null); setPreselectedTime(undefined) }}
        />
      </Modal>
    </div>
  )
}

export default function TodayPage() {
  return (
    <AuthGuard>
      <TodayContent />
    </AuthGuard>
  )
}
