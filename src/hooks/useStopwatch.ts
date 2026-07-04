"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return clear
  }, [clear])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const stop = useCallback(() => {
    clear()
    setIsRunning(false)
    const total = elapsed
    setElapsed(0)
    return total
  }, [elapsed, clear])

  const pause = useCallback(() => {
    clear()
    setIsRunning(false)
  }, [clear])

  const reset = useCallback(() => {
    clear()
    setElapsed(0)
    setIsRunning(false)
  }, [clear])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
    }
    return clear
  }, [isRunning, clear])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  return {
    elapsed, minutes, seconds,
    isRunning,
    start, stop, pause, reset,
  }
}
