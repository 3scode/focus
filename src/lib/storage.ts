import { get, set, del } from "idb-keyval"
import type { Block, Category, FocusSession, Settings } from "@/types"
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "./constants"

export async function getBlocks(): Promise<Block[]> {
  const blocks = await get<Block[]>("blocks")
  return blocks ?? []
}

export async function setBlocks(blocks: Block[]): Promise<void> {
  await set("blocks", blocks)
}

export async function getBlock(id: string): Promise<Block | null> {
  const blocks = await getBlocks()
  return blocks.find((b) => b.id === id) ?? null
}

export async function saveBlock(block: Block): Promise<void> {
  const blocks = await getBlocks()
  const idx = blocks.findIndex((b) => b.id === block.id)
  if (idx >= 0) {
    blocks[idx] = block
  } else {
    blocks.push(block)
  }
  await setBlocks(blocks)
}

export async function deleteBlock(id: string): Promise<void> {
  const blocks = await getBlocks()
  await setBlocks(blocks.filter((b) => b.id !== id))
}

export async function deleteRecurringSeries(groupId: string): Promise<void> {
  const blocks = await getBlocks()
  await setBlocks(blocks.filter((b) => b.recurringGroupId !== groupId))
}

export async function getBlocksByDate(date: string): Promise<Block[]> {
  const blocks = await getBlocks()
  return blocks
    .filter((b) => b.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export async function getCategories(): Promise<Category[]> {
  const cats = await get<Category[]>("categories")
  return cats ?? DEFAULT_CATEGORIES
}

export async function setCategories(cats: Category[]): Promise<void> {
  await set("categories", cats)
}

export async function getFocusSessions(): Promise<FocusSession[]> {
  const sessions = await get<FocusSession[]>("focusSessions")
  return sessions ?? []
}

export async function setFocusSessions(sessions: FocusSession[]): Promise<void> {
  await set("focusSessions", sessions)
}

export async function saveFocusSession(session: FocusSession): Promise<void> {
  const sessions = await getFocusSessions()
  sessions.push(session)
  await setFocusSessions(sessions)
}

export async function getSettings(): Promise<Settings> {
  const settings = await get<Settings>("settings")
  return settings ?? DEFAULT_SETTINGS
}

export async function setSettings(settings: Settings): Promise<void> {
  await set("settings", settings)
}

export async function clearAllData(): Promise<void> {
  await del("blocks")
  await del("categories")
  await del("focusSessions")
  await del("settings")
}
