"use client"

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react"
import type { Block, Category, FocusSession, Habit, HabitRecord, Settings } from "@/types"
import * as storage from "@/lib/storage"
import { formatDate, calcDuration } from "@/lib/time"
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/lib/constants"
import { toast } from "sonner"

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
  addBlock: (block: Block) => Promise<void>
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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [b, c, h, hr, s] = await Promise.all([
        storage.getBlocks(),
        storage.getCategories(),
        storage.getHabits(),
        storage.getHabitRecords(),
        storage.getSettings(),
      ])
      if (!mounted) return
      setBlocks(b)
      setCats(c)
      setHabitsState(h)
      setHabitRecordsState(hr)
      setSettingsState(s)
      document.documentElement.classList.toggle("dark", s.theme === "dark")
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark")
  }, [settings.theme])

  const addBlock = useCallback(async (block: Block) => {
    await storage.saveBlock(block)
    setBlocks((prev) => [...prev, block])
  }, [])

  const updateBlock = useCallback(async (block: Block) => {
    await storage.saveBlock(block)
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? block : b)))
  }, [])

  const removeBlock = useCallback(async (id: string) => {
    await storage.deleteBlock(id)
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const removeRecurringSeries = useCallback(async (groupId: string) => {
    await storage.deleteRecurringSeries(groupId)
    setBlocks((prev) => prev.filter((b) => b.recurringGroupId !== groupId))
  }, [])

  const toggleBlockComplete = useCallback(async (id: string, confirmed?: boolean) => {
    const blocksList = await storage.getBlocks()
    const block = blocksList.find((b) => b.id === id)
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
    
    block.completed = !block.completed
    if (block.completed) block.missed = false
    block.updatedAt = new Date().toISOString()
    await storage.saveBlock(block)
    setBlocks((prev) => prev.map((b) => (b.id === id ? block : b)))
  }, [])

  const toggleBlockMissed = useCallback(async (id: string) => {
    const blocksList = await storage.getBlocks()
    const block = blocksList.find((b) => b.id === id)
    if (!block) return
    block.missed = !block.missed
    if (block.missed) block.completed = false
    block.updatedAt = new Date().toISOString()
    await storage.saveBlock(block)
    setBlocks((prev) => prev.map((b) => (b.id === id ? block : b)))
  }, [])

  const updateCategories = useCallback(async (cats: Category[]) => {
    await storage.setCategories(cats)
    setCats(cats)
  }, [])

  const updateSettings = useCallback(async (s: Settings) => {
    await storage.setSettings(s)
    setSettingsState(s)
  }, [])

  const addFocusSession = useCallback(async (session: FocusSession) => {
    await storage.saveFocusSession(session)
    const blocksList = await storage.getBlocks()
    const block = blocksList.find((b) => b.id === session.blockId)
    if (block) {
      block.focusSessions = [...(block.focusSessions || []), session]
      
      const taskDurationMins = calcDuration(block.startTime, block.endTime)
      const totalFocusMins = block.focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
      
      if (totalFocusMins >= taskDurationMins) {
        block.completed = true
      }
      
      block.updatedAt = new Date().toISOString()
      await storage.saveBlock(block)
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? block : b)))
    }
  }, [])

  const setHabits = useCallback(async (h: Habit[]) => {
    await storage.setHabits(h)
    setHabitsState(h)
  }, [])

  const addHabit = useCallback(async (habit: Habit) => {
    const h = await storage.getHabits()
    h.push(habit)
    await storage.setHabits(h)
    setHabitsState(h)
  }, [])

  const deleteHabit = useCallback(async (id: string) => {
    const h = await storage.getHabits()
    const filtered = h.filter((hab) => hab.id !== id)
    await storage.setHabits(filtered)
    setHabitsState(filtered)
    const records = await storage.getHabitRecords()
    const filteredRecords = records.filter((r) => r.habitId !== id)
    await storage.setHabitRecords(filteredRecords)
    setHabitRecordsState(filteredRecords)
  }, [])

  const addHabitRecord = useCallback(async (record: HabitRecord) => {
    await storage.saveHabitRecord(record)
    setHabitRecordsState((prev) => [...prev, record])
  }, [])

  const deleteHabitRecord = useCallback(async (id: string) => {
    await storage.deleteHabitRecord(id)
    setHabitRecordsState((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const refresh = useCallback(async () => {
    const [b, c, h, hr, s] = await Promise.all([
      storage.getBlocks(),
      storage.getCategories(),
      storage.getHabits(),
      storage.getHabitRecords(),
      storage.getSettings(),
    ])
    setBlocks(b)
    setCats(c)
    setHabitsState(h)
    setHabitRecordsState(hr)
    setSettingsState(s)
    setLoading(false)
  }, [])

  const clearData = useCallback(async () => {
    await storage.clearAllData()
    setBlocks([])
    setCats(DEFAULT_CATEGORIES)
    setHabitsState([])
    setHabitRecordsState([])
    setSettingsState(DEFAULT_SETTINGS)
  }, [])

  return (
    <AppContext.Provider
      value={{
        blocks, categories, habits, habitRecords, settings, selectedDate, loading,
        refresh, setSelectedDate, addBlock, updateBlock, removeBlock, removeRecurringSeries,
        toggleBlockComplete, toggleBlockMissed, updateCategories, updateSettings,
        addFocusSession, setHabits, addHabit, deleteHabit, addHabitRecord, deleteHabitRecord, clearData,
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
