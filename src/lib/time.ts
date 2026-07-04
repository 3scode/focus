import { format, parse, addMinutes, differenceInMinutes, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, addWeeks, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { v4 as uuidv4 } from "uuid"
import type { Block } from "@/types"

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function formatDisplayDate(date: Date): string {
  return format(date, "EEEE, MMMM d", { locale: id })
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} — ${end}`
}

export function formatDuration(start: string, end: string): string {
  const mins = calcDuration(start, end)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}`.trim()
}

export function calcDuration(start: string, end: string): number {
  const s = parse(start, "HH:mm", new Date())
  const e = parse(end, "HH:mm", new Date())
  return differenceInMinutes(e, s)
}

export function calcEndTime(start: string, durationMinutes: number): string {
  const s = parse(start, "HH:mm", new Date())
  const e = addMinutes(s, durationMinutes)
  return format(e, "HH:mm")
}

export function generateTimeSlots(start: string, end: string, interval = 60): string[] {
  const slots: string[] = []
  let current = parse(start, "HH:mm", new Date())
  const endTime = parse(end, "HH:mm", new Date())

  while (current < endTime) {
    slots.push(format(current, "HH:mm"))
    current = addMinutes(current, interval)
  }
  return slots
}

export function getWeekDays(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start: weekStart, end: weekEnd })
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export { format }

export function checkOverlap(
  startA: string, endA: string,
  startB: string, endB: string
): boolean {
  return startA < endB && startB < endA
}

export function generateRecurringBlocks(baseBlock: Block): Block[] {
  if (!baseBlock.recurring || !baseBlock.recurringPattern) {
    return [baseBlock]
  }

  const blocks: Block[] = []
  const startDate = baseBlock.recurringStartDate
    ? parseISO(baseBlock.recurringStartDate)
    : parseISO(baseBlock.date)
  
  const endDate = baseBlock.recurringEndDate 
    ? parseISO(baseBlock.recurringEndDate)
    : addWeeks(startDate, 4)
  
  let currentDate = startDate
  const now = new Date().toISOString()
  
  while (currentDate <= endDate) {
    const block: Block = {
      ...baseBlock,
      id: uuidv4(),
      date: format(currentDate, "yyyy-MM-dd"),
      createdAt: now,
      updatedAt: now,
    }
    blocks.push(block)
    
    if (baseBlock.recurringPattern === "daily") {
      currentDate = addDays(currentDate, 1)
    } else if (baseBlock.recurringPattern === "weekly") {
      currentDate = addWeeks(currentDate, 1)
    } else {
      break
    }
  }
  
  return blocks
}
