"use client"

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react"
import type { Block, Category, FocusSession, Settings } from "@/types"
import * as storage from "@/lib/storage"
import { formatDate, calcDuration } from "@/lib/time"
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/lib/constants"
import { toast } from "sonner"

interface AppState {
  blocks: Block[]
  categories: Category[]
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
  toggleBlockComplete: (id: string) => Promise<void>
  toggleBlockMissed: (id: string) => Promise<void>
  updateCategories: (cats: Category[]) => Promise<void>
  updateSettings: (settings: Settings) => Promise<void>
  addFocusSession: (session: FocusSession) => Promise<void>
  clearData: () => Promise<void>
  activeBlockId: string | null
  setActiveBlockId: (id: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [categories, setCats] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS)
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [loading, setLoading] = useState(true)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [b, c, s] = await Promise.all([
        storage.getBlocks(),
        storage.getCategories(),
        storage.getSettings(),
      ])
      if (!mounted) return
      setBlocks(b)
      setCats(c)
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

  const toggleBlockComplete = useCallback(async (id: string) => {
    const blocksList = await storage.getBlocks()
    const block = blocksList.find((b) => b.id === id)
    if (!block) return
    
    if (!block.completed) {
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
      block.completed = true
      block.focusSessions = [...(block.focusSessions || []), session]
      block.updatedAt = new Date().toISOString()
      await storage.saveBlock(block)
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? block : b)))
    }
  }, [])

  const refresh = useCallback(async () => {
    const [b, c, s] = await Promise.all([
      storage.getBlocks(),
      storage.getCategories(),
      storage.getSettings(),
    ])
    setBlocks(b)
    setCats(c)
    setSettingsState(s)
    setLoading(false)
  }, [])

  const clearData = useCallback(async () => {
    await storage.clearAllData()
    setBlocks([])
    setCats(DEFAULT_CATEGORIES)
    setSettingsState(DEFAULT_SETTINGS)
  }, [])

  return (
    <AppContext.Provider
      value={{
        blocks, categories, settings, selectedDate, loading,
        refresh, setSelectedDate, addBlock, updateBlock, removeBlock, removeRecurringSeries,
        toggleBlockComplete, toggleBlockMissed, updateCategories, updateSettings,
        addFocusSession, clearData,
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
