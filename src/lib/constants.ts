import type { Category, Settings } from "@/types"

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "work", name: "Work", color: "#3B82F6", order: 0 },
  { id: "personal", name: "Personal", color: "#10B981", order: 1 },
  { id: "health", name: "Health", color: "#F43F5E", order: 2 },
  { id: "learning", name: "Learning", color: "#8B5CF6", order: 3 },
  { id: "break", name: "Break", color: "#F59E0B", order: 4 },
  { id: "other", name: "Other", color: "#6B7280", order: 5 },
]

export const DEFAULT_SETTINGS: Settings = {
  dayStart: "08:00",
  dayEnd: "18:00",
  defaultTimer: 25,
  breakDuration: 5,
  weekStart: 1,
  theme: "light",
}

export const TIMELINE_SLOT_HEIGHT = 60
export const MIN_BLOCK_DURATION = 15
export const DEFAULT_TIMER_LIMIT = 25
export const BREAK_DURATION = 5 // fallback, use settings.breakDuration
