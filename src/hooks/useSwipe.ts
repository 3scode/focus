"use client"

import { useRef, useCallback } from "react"

interface UseSwipeOptions {
  onSwipeLeft: () => void
  threshold?: number
}

export function useSwipe({ onSwipeLeft, threshold = 80 }: UseSwipeOptions) {
  const startX = useRef(0)
  const startY = useRef(0)
  const swiped = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    swiped.current = false
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (swiped.current) return
    const dx = startX.current - e.touches[0].clientX
    const dy = Math.abs(startY.current - e.touches[0].clientY)

    if (dx > threshold && dx > dy * 1.5) {
      swiped.current = true
      onSwipeLeft()
    }
  }, [onSwipeLeft, threshold])

  return { onTouchStart, onTouchMove }
}
