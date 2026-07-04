export interface Block {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  categoryId: string
  color?: string
  completed: boolean
  missed?: boolean
  focusSessions: FocusSession[]
  createdAt: string
  updatedAt: string
  recurring?: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly'
  recurringEndDate?: string
  recurringGroupId?: string
}

export interface Category {
  id: string
  name: string
  color: string
  order: number
}

export interface FocusSession {
  id: string
  blockId: string
  date: string
  durationMinutes: number
  completedAt: string
}

export interface Settings {
  dayStart: string
  dayEnd: string
  defaultTimer: number
  breakDuration: number
  weekStart: number
  theme: "light" | "dark"
}
