"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export function useTimer(initialMinutes: number, onComplete?: () => void) {
  const [timeLeft, setTimeLeft] = useState(() => initialMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return clear
  }, [clear])

  useEffect(() => {
    clear()
    /* eslint-disable react-hooks/set-state-in-effect */
    setTimeLeft(initialMinutes * 60)
    setIsRunning(false)
    setIsPaused(false)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialMinutes, clear])

  useEffect(() => {
    if (timeLeft <= 0 && (isRunning || isPaused)) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setIsRunning(false)
      /* eslint-enable react-hooks/set-state-in-effect */
      onCompleteRef.current?.()
    }
  }, [timeLeft, isRunning, isPaused])

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    }
    return clear
  }, [isRunning, isPaused, clear])

  const start = useCallback(() => {
    setIsRunning(true)
    setIsPaused(false)
  }, [])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  const reset = useCallback((mins?: number) => {
    clear()
    setTimeLeft((mins ?? initialMinutes) * 60)
    setIsRunning(false)
    setIsPaused(false)
  }, [initialMinutes, clear])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = initialMinutes > 0 ? ((initialMinutes * 60 - timeLeft) / (initialMinutes * 60)) * 100 : 0

  return {
    timeLeft, minutes, seconds, progress,
    isRunning, isPaused,
    start, pause, resume, reset,
  }
}
