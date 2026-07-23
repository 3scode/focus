import type { Block, Category, FocusSession, Habit, HabitRecord, Settings } from "@/types"
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "./constants"

type Method = "GET" | "POST" | "PUT" | "DELETE"

async function api(url: string, method: Method = "GET", body?: unknown): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }))
    throw new Error(err.error || `API error ${res.status}`)
  }
  return res.json()
}

export async function getBlocks(): Promise<Block[]> {
  const data = await api("/api/blocks")
  return data.map((b: any) => ({
    ...b,
    focusSessions: b.focusSessions ?? [],
    completed: b.completed ?? false,
  }))
}

export async function saveBlock(block: Block): Promise<void> {
  await api("/api/blocks", "POST", block)
}

export async function deleteBlock(id: string): Promise<void> {
  await api("/api/blocks", "DELETE", { id })
}

export async function deleteRecurringSeries(groupId: string): Promise<void> {
  await api("/api/blocks/recurring", "DELETE", { groupId })
}

export async function setBlocks(blocks: Block[]): Promise<void> {
  const existing = await getBlocks()
  await Promise.all(existing.map((b) => deleteBlock(b.id)))
  await Promise.all(blocks.map((b) => saveBlock(b)))
}

export async function getBlock(id: string): Promise<Block | null> {
  const blocks = await getBlocks()
  return blocks.find((b) => b.id === id) ?? null
}

export async function getBlocksByDate(date: string): Promise<Block[]> {
  const blocks = await getBlocks()
  return blocks
    .filter((b) => b.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export async function getCategories(): Promise<Category[]> {
  const data = await api("/api/categories")
  return data.length > 0 ? data : DEFAULT_CATEGORIES
}

export async function setCategories(cats: Category[]): Promise<void> {
  await api("/api/categories", "POST", cats)
}

export async function getFocusSessions(): Promise<FocusSession[]> {
  return api("/api/focus-sessions")
}

export async function setFocusSessions(sessions: FocusSession[]): Promise<void> {
  await api("/api/focus-sessions", "PUT", sessions)
}

export async function saveFocusSession(session: FocusSession): Promise<void> {
  await api("/api/focus-sessions", "POST", session)
}

export async function getSettings(): Promise<Settings> {
  const data = await api("/api/settings")
  return data ?? DEFAULT_SETTINGS
}

export async function setSettings(s: Partial<Settings>): Promise<void> {
  await api("/api/settings", "POST", s)
}

export async function getHabits(): Promise<Habit[]> {
  return api("/api/habits")
}

export async function setHabits(h: Habit[]): Promise<void> {
  await api("/api/habits", "PUT", h)
}

export async function addHabit(habit: Habit): Promise<void> {
  await api("/api/habits", "POST", habit)
}

export async function deleteHabit(id: string): Promise<void> {
  await api(`/api/habits/${id}`, "DELETE")
}

export async function getHabitRecords(): Promise<HabitRecord[]> {
  return api("/api/habit-records")
}

export async function setHabitRecords(records: HabitRecord[]): Promise<void> {
  await api("/api/habit-records", "PUT", records)
}

export async function saveHabitRecord(record: HabitRecord): Promise<void> {
  await api("/api/habit-records", "POST", record)
}

export async function deleteHabitRecord(id: string): Promise<void> {
  await api("/api/habit-records", "DELETE", { id })
}

export async function clearAllData(): Promise<void> {
  const [blocks, habits] = await Promise.all([getBlocks(), getHabits()])
  await Promise.all(blocks.map((b) => deleteBlock(b.id)))
  await Promise.all(habits.map((h) => deleteHabit(h.id)))
  await api("/api/categories", "POST", [])
  await api("/api/settings", "POST", DEFAULT_SETTINGS)
}
