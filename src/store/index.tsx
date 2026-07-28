"use client"

import { createContext, useContext, useCallback, useEffect, useState, useRef, type ReactNode } from "react"
import type { Block, Category, FocusSession, Habit, HabitRecord, Settings } from "@/types"
import * as api from "@/lib/api"
import { formatDate, calcDuration } from "@/lib/time"
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/lib/constants"
import { toast } from "sonner"
import { useAuth } from "@/store/auth"

interface AppState {
  blocks: Block[]
  categories: Category[]
  habits: Habit[]
  habitRecords: HabitRecord[]
  settings: Settings
  selectedDate: string
  loading: boolean
}

interface AppContextValue extends AppState {
  refresh: () => Promise<void>
  setSelectedDate: (date: string) => void
  addBlock: (block: Block, silent?: boolean) => Promise<void>
  updateBlock: (block: Block) => Promise<void>
  removeBlock: (id: string) => Promise<void>
  removeRecurringSeries: (groupId: string) => Promise<void>
  toggleBlockComplete: (id: string, confirmed?: boolean) => Promise<void>
  toggleBlockMissed: (id: string) => Promise<void>
  updateCategories: (cats: Category[]) => Promise<void>
  updateSettings: (settings: Settings) => Promise<void>
  addFocusSession: (session: FocusSession) => Promise<void>
  setHabits: (habits: Habit[]) => Promise<void>
  addHabit: (habit: Habit) => Promise<void>
  updateHabit: (id: string, data: Partial<Habit>) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  addHabitRecord: (record: HabitRecord) => Promise<void>
  deleteHabitRecord: (id: string) => Promise<void>
  clearData: () => Promise<void>
  activeBlockId: string | null
  setActiveBlockId: (id: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [categories, setCats] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [habits, setHabitsState] = useState<Habit[]>([])
  const [habitRecords, setHabitRecordsState] = useState<HabitRecord[]>([])
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS)
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [loading, setLoading] = useState(true)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const { user } = useAuth()
  const blocksRef = useRef(blocks)

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!user) {
        if (mounted) setLoading(false)
        return
      }
      try {
        const [b, c, h, hr, s] = await Promise.all([
          api.getBlocks(),
          api.getCategories(),
          api.getHabits(),
          api.getHabitRecords(),
          api.getSettings(),
        ])
        if (!mounted) return
        setBlocks(b)
        setCats(c)
        setHabitsState(h)
        setHabitRecordsState(hr)
        setSettingsState(s)
        document.documentElement.classList.toggle("dark", s.theme === "dark")
      } catch {
        toast.error("Gagal memuat data")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [user])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark")
  }, [settings.theme])

  const addBlock = useCallback(async (block: Block, silent?: boolean) => {
    try {
      await api.saveBlock(block)
      setBlocks((prev) => [...prev, block])
      if (!silent) toast.success("Block ditambahkan")
    } catch {
      if (!silent) toast.error("Gagal menambahkan block")
    }
  }, [])

  const updateBlock = useCallback(async (block: Block) => {
    try {
      await api.saveBlock(block)
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? block : b)))
      toast.success("Block diperbarui")
    } catch {
      toast.error("Gagal memperbarui block")
    }
  }, [])

  const removeBlock = useCallback(async (id: string) => {
    try {
      await api.deleteBlock(id)
      setBlocks((prev) => prev.filter((b) => b.id !== id))
      toast.success("Block dihapus")
    } catch {
      toast.error("Gagal menghapus block")
    }
  }, [])

  const removeRecurringSeries = useCallback(async (groupId: string) => {
    try {
      await api.deleteRecurringSeries(groupId)
      setBlocks((prev) => prev.filter((b) => b.recurringGroupId !== groupId))
      toast.success("Semua block berulang dihapus")
    } catch {
      toast.error("Gagal menghapus series")
    }
  }, [])

  const toggleBlockComplete = useCallback(async (id: string, confirmed?: boolean) => {
    const block = blocksRef.current.find((b) => b.id === id)
    if (!block) return

    if (!block.completed && !confirmed) {
      const taskDurationMins = calcDuration(block.startTime, block.endTime)
      const totalFocusMins = block.focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0)

      if (totalFocusMins < taskDurationMins) {
        const progressPercent = Math.round((totalFocusMins / taskDurationMins) * 100)
        toast.error(`Task belum selesai! Progress: ${progressPercent}% (${totalFocusMins}/${taskDurationMins} menit)`)
        return
      }
    }

    const updated: Block = {
      ...block,
      completed: !block.completed,
      missed: block.completed ? false : block.missed,
      updatedAt: new Date().toISOString(),
    }
    try {
      await api.saveBlock(updated)
      setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)))
      toast.success(updated.completed ? "Block selesai" : "Block dibatalkan")
    } catch {
      toast.error("Gagal menyimpan perubahan")
    }
  }, [])

  const toggleBlockMissed = useCallback(async (id: string) => {
    const block = blocksRef.current.find((b) => b.id === id)
    if (!block) return

    const updated: Block = {
      ...block,
      missed: !block.missed,
      completed: !block.missed ? false : block.completed,
      updatedAt: new Date().toISOString(),
    }
    try {
      await api.saveBlock(updated)
      setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)))
      toast.success(updated.missed ? "Block ditandai missed" : "Block dibatalkan missed")
    } catch {
      toast.error("Gagal menyimpan perubahan")
    }
  }, [])

  const updateCategories = useCallback(async (cats: Category[]) => {
    try {
      await api.setCategories(cats)
      setCats(cats)
      toast.success("Kategori diperbarui")
    } catch {
      toast.error("Gagal memperbarui kategori")
    }
  }, [])

  const updateSettings = useCallback(async (s: Settings) => {
    try {
      await api.setSettings(s)
      setSettingsState(s)
      toast.success("Pengaturan disimpan")
    } catch {
      toast.error("Gagal menyimpan pengaturan")
    }
  }, [])

  const addFocusSession = useCallback(async (session: FocusSession) => {
    try {
      await api.saveFocusSession(session)
    } catch {
      toast.error("Gagal menyimpan sesi fokus")
      return
    }

    const block = blocksRef.current.find((b) => b.id === session.blockId)
    if (!block) return

    const allSessions = [...(block.focusSessions || []), session]
    const taskDurationMins = calcDuration(block.startTime, block.endTime)
    const totalFocusMins = allSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
    const shouldComplete = totalFocusMins >= taskDurationMins

    const updated: Block = {
      ...block,
      focusSessions: allSessions,
      completed: shouldComplete || block.completed,
      updatedAt: new Date().toISOString(),
    }
    try {
      await api.saveBlock(updated)
      setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    } catch {
      toast.error("Gagal memperbarui block setelah sesi fokus")
    }
  }, [])

  const setHabits = useCallback(async (h: Habit[]) => {
    try {
      await api.setHabits(h)
      setHabitsState(h)
      toast.success("Habits disimpan")
    } catch {
      toast.error("Gagal menyimpan habits")
    }
  }, [])

  const addHabit = useCallback(async (habit: Habit) => {
    try {
      const created = await api.addHabit(habit)
      setHabitsState((prev) => [...prev, created])
      toast.success("Habit ditambahkan")
    } catch {
      toast.error("Gagal menambahkan habit")
    }
  }, [])

  const updateHabit = useCallback(async (id: string, data: Partial<Habit>) => {
    try {
      await api.updateHabit(id, data)
      setHabitsState((prev) => prev.map((h) => (h.id === id ? { ...h, ...data } : h)))
    } catch {
      toast.error("Gagal memperbarui habit")
    }
  }, [])

  const deleteHabit = useCallback(async (id: string) => {
    try {
      await api.deleteHabit(id)
      setHabitsState((prev) => prev.filter((h) => h.id !== id))
      setHabitRecordsState((prev) => prev.filter((r) => r.habitId !== id))
      toast.success("Habit dihapus")
    } catch {
      toast.error("Gagal menghapus habit")
    }
  }, [])

  const addHabitRecord = useCallback(async (record: HabitRecord) => {
    try {
      await api.saveHabitRecord(record)
      setHabitRecordsState((prev) => [...prev, record])
    } catch {
      toast.error("Gagal menyimpan record")
    }
  }, [])

  const deleteHabitRecord = useCallback(async (id: string) => {
    try {
      await api.deleteHabitRecord(id)
      setHabitRecordsState((prev) => prev.filter((r) => r.id !== id))
    } catch {
      toast.error("Gagal menghapus record")
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [b, c, h, hr, s] = await Promise.all([
        api.getBlocks(),
        api.getCategories(),
        api.getHabits(),
        api.getHabitRecords(),
        api.getSettings(),
      ])
      setBlocks(b)
      setCats(c)
      setHabitsState(h)
      setHabitRecordsState(hr)
      setSettingsState(s)
    } catch {
      toast.error("Gagal refresh data")
    }
    setLoading(false)
  }, [])

  const clearData = useCallback(async () => {
    try {
      await api.clearAllData()
      setBlocks([])
      setCats(DEFAULT_CATEGORIES)
      setHabitsState([])
      setHabitRecordsState([])
      setSettingsState(DEFAULT_SETTINGS)
      toast.success("Semua data berhasil dihapus")
    } catch {
      toast.error("Gagal menghapus data")
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        blocks, categories, habits, habitRecords, settings, selectedDate, loading,
        refresh, setSelectedDate, addBlock, updateBlock, removeBlock, removeRecurringSeries,
        toggleBlockComplete, toggleBlockMissed, updateCategories, updateSettings,
        addFocusSession, setHabits, addHabit, updateHabit, deleteHabit, addHabitRecord, deleteHabitRecord, clearData,
        activeBlockId, setActiveBlockId,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
