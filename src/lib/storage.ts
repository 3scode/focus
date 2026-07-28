import { get, set } from "idb-keyval"
import type { Block, Category, FocusSession, Habit, HabitRecord, Settings } from "@/types"
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "./constants"

const KEYS = {
  BLOCKS: "time-blocking:blocks",
  CATEGORIES: "time-blocking:categories",
  HABITS: "time-blocking:habits",
  HABIT_RECORDS: "time-blocking:habitRecords",
  FOCUS_SESSIONS: "time-blocking:focusSessions",
  SETTINGS: "time-blocking:settings",
} as const

export async function getBlocks(): Promise<Block[]> {
  const data = await get<Block[]>(KEYS.BLOCKS)
  return (data ?? []).map((b) => ({
    ...b,
    focusSessions: b.focusSessions ?? [],
    completed: b.completed ?? false,
  }))
}

export async function saveBlock(block: Block): Promise<void> {
  const blocks = await getBlocks()
  const idx = blocks.findIndex((b) => b.id === block.id)
  if (idx >= 0) {
    blocks[idx] = block
  } else {
    blocks.push(block)
  }
  await set(KEYS.BLOCKS, blocks)
}

export async function deleteBlock(id: string): Promise<void> {
  const blocks = await getBlocks()
  await set(KEYS.BLOCKS, blocks.filter((b) => b.id !== id))
}

export async function deleteRecurringSeries(groupId: string): Promise<void> {
  const blocks = await getBlocks()
  await set(KEYS.BLOCKS, blocks.filter((b) => b.recurringGroupId !== groupId))
}

export async function setBlocks(blocks: Block[]): Promise<void> {
  await set(KEYS.BLOCKS, blocks)
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
  const data = await get<Category[]>(KEYS.CATEGORIES)
  return data && data.length > 0 ? data : DEFAULT_CATEGORIES
}

export async function setCategories(cats: Category[]): Promise<void> {
  await set(KEYS.CATEGORIES, cats)
}

export async function getFocusSessions(): Promise<FocusSession[]> {
  return (await get<FocusSession[]>(KEYS.FOCUS_SESSIONS)) ?? []
}

export async function setFocusSessions(sessions: FocusSession[]): Promise<void> {
  await set(KEYS.FOCUS_SESSIONS, sessions)
}

export async function saveFocusSession(session: FocusSession): Promise<void> {
  const sessions = await getFocusSessions()
  sessions.push(session)
  await set(KEYS.FOCUS_SESSIONS, sessions)
}

export async function getSettings(): Promise<Settings> {
  const data = await get<Settings>(KEYS.SETTINGS)
  return data ?? DEFAULT_SETTINGS
}

export async function setSettings(s: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  await set(KEYS.SETTINGS, { ...current, ...s })
}

export async function getHabits(): Promise<Habit[]> {
  return (await get<Habit[]>(KEYS.HABITS)) ?? []
}

export async function setHabits(h: Habit[]): Promise<void> {
  await set(KEYS.HABITS, h)
}

export async function addHabit(habit: Habit): Promise<void> {
  const habits = await getHabits()
  habits.push(habit)
  await set(KEYS.HABITS, habits)
}

export async function deleteHabit(id: string): Promise<void> {
  const habits = await getHabits()
  await set(KEYS.HABITS, habits.filter((h) => h.id !== id))
}

export async function getHabitRecords(): Promise<HabitRecord[]> {
  return (await get<HabitRecord[]>(KEYS.HABIT_RECORDS)) ?? []
}

export async function setHabitRecords(records: HabitRecord[]): Promise<void> {
  await set(KEYS.HABIT_RECORDS, records)
}

export async function saveHabitRecord(record: HabitRecord): Promise<void> {
  const records = await getHabitRecords()
  records.push(record)
  await set(KEYS.HABIT_RECORDS, records)
}

export async function deleteHabitRecord(id: string): Promise<void> {
  const records = await getHabitRecords()
  await set(KEYS.HABIT_RECORDS, records.filter((r) => r.id !== id))
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    set(KEYS.BLOCKS, []),
    set(KEYS.CATEGORIES, DEFAULT_CATEGORIES),
    set(KEYS.HABITS, []),
    set(KEYS.HABIT_RECORDS, []),
    set(KEYS.FOCUS_SESSIONS, []),
    set(KEYS.SETTINGS, DEFAULT_SETTINGS),
  ])
}