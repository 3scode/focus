"use client"

import { useMemo } from "react"
import { useApp } from "@/store"
import { checkOverlap } from "@/lib/time"

export function useBlocksByDate(date: string) {
  const { blocks } = useApp()

  return useMemo(() =>
    blocks
      .filter((b) => b.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [blocks, date]
  )
}

export function useBlockOverlap(date: string, startTime: string, endTime: string, excludeId?: string) {
  const { blocks } = useApp()

  return useMemo(() =>
    blocks.some(
      (b) =>
        b.date === date &&
        b.id !== excludeId &&
        checkOverlap(startTime, endTime, b.startTime, b.endTime)
    ),
    [blocks, date, startTime, endTime, excludeId]
  )
}

export function useDailyProgress(date: string) {
  const dayBlocks = useBlocksByDate(date)

  return useMemo(() => {
    const total = dayBlocks.length
    const completed = dayBlocks.filter((b) => b.completed).length
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }, [dayBlocks])
}
