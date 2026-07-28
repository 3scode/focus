import type { Block, Category, FocusSession, Habit, HabitRecord, Settings } from "@/types"
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "./constants"

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? res.statusText)
  }
  return res.json()
}

export async function getBlocks(): Promise<Block[]> {
  const data = await req<Block[]>("/api/blocks")
  return data.map((b) => ({
    ...b,
    focusSessions: b.focusSessions ?? [],
    completed: b.completed ?? false,
  }))
}

export async function saveBlock(block: Block): Promise<void> {
  await req("/api/blocks", { method: "POST", body: JSON.stringify(block) })
}

export async function deleteBlock(id: string): Promise<void> {
  await req("/api/blocks", { method: "DELETE", body: JSON.stringify({ id }) })
}

export async function deleteRecurringSeries(groupId: string): Promise<void> {
  await req("/api/blocks/recurring", { method: "DELETE", body: JSON.stringify({ groupId }) })
}

export async function getCategories(): Promise<Category[]> {
  const data = await req<Category[]>("/api/categories")
  return data.length > 0 ? data : DEFAULT_CATEGORIES
}

export async function setCategories(cats: Category[]): Promise<void> {
  for (const cat of cats) {
    await req("/api/categories", { method: "POST", body: JSON.stringify(cat) })
  }
}

export async function deleteCategory(id: string): Promise<void> {
  await req("/api/categories", { method: "DELETE", body: JSON.stringify({ id }) })
}

export async function getFocusSessions(): Promise<FocusSession[]> {
  return req<FocusSession[]>("/api/focus-sessions")
}

export async function setFocusSessions(sessions: FocusSession[]): Promise<void> {
  for (const s of sessions) {
    await req("/api/focus-sessions", { method: "POST", body: JSON.stringify(s) })
  }
}

export async function saveFocusSession(session: FocusSession): Promise<void> {
  await req("/api/focus-sessions", { method: "POST", body: JSON.stringify(session) })
}

export async function getSettings(): Promise<Settings> {
  const data = await req<Settings | null>("/api/settings")
  return data ?? DEFAULT_SETTINGS
}

export async function setSettings(s: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  await req("/api/settings", { method: "POST", body: JSON.stringify({ ...current, ...s }) })
}

export async function getHabits(): Promise<Habit[]> {
  return req<Habit[]>("/api/habits")
}

export async function setHabits(h: Habit[]): Promise<void> {
  for (const item of h) {
    await req("/api/habits", { method: "POST", body: JSON.stringify(item) })
  }
}

export async function addHabit(habit: Habit): Promise<Habit> {
  return req<Habit>("/api/habits", { method: "POST", body: JSON.stringify(habit) })
}

export async function updateHabit(id: string, data: Partial<Habit>): Promise<void> {
  await req(`/api/habits/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export async function deleteHabit(id: string): Promise<void> {
  await req(`/api/habits/${id}`, { method: "DELETE" })
}

export async function getHabitRecords(): Promise<HabitRecord[]> {
  return req<HabitRecord[]>("/api/habit-records")
}

export async function setHabitRecords(records: HabitRecord[]): Promise<void> {
  for (const r of records) {
    await req("/api/habit-records", { method: "POST", body: JSON.stringify(r) })
  }
}

export async function saveHabitRecord(record: HabitRecord): Promise<void> {
  await req("/api/habit-records", { method: "POST", body: JSON.stringify(record) })
}

export async function deleteHabitRecord(id: string): Promise<void> {
  await req("/api/habit-records", { method: "DELETE", body: JSON.stringify({ id }) })
}

export async function clearAllData(): Promise<void> {
  const [blocks, cats, habits, habitRecs, sessions] = await Promise.all([
    getBlocks(),
    getCategories(),
    getHabits(),
    getHabitRecords(),
    getFocusSessions(),
  ])
  await Promise.all([
    ...blocks.map((b) => deleteBlock(b.id)),
    ...cats.map((c) => deleteCategory(c.id)),
    ...habits.map((h) => deleteHabit(h.id)),
    ...habitRecs.map((r) => deleteHabitRecord(r.id)),
    ...sessions.map((s) => deleteFocusSession(s.id)),
  ])
}

async function deleteFocusSession(id: string): Promise<void> {
  await req("/api/focus-sessions", { method: "DELETE", body: JSON.stringify({ id }) })
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
