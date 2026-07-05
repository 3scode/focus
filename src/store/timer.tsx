"use client"

import { createContext, useContext, useCallback, useRef, useEffect, useState, type ReactNode } from "react"
import { useApp } from "./index"

export type Phase = "idle" | "focus" | "break"

interface TimerContextValue {
  phase: Phase
  elapsed: number
  isRunning: boolean
  isPaused: boolean
  focusMinutes: number
  breakTimeLeft: number
  breakTotal: number
  completedSessions: number
  minutes: number
  seconds: number
  breakMinutes: number
  breakSeconds: number
  breakProgress: number
  stopwatchProgress: number

  startFocus: (blockId: string) => void
  pauseFocus: () => void
  resumeFocus: () => void
  stopFocus: () => number
  skipFocus: () => void
  setFocusMinutes: (mins: number) => void

  startBreak: (mins: number) => void
  pauseBreak: () => void
  resumeBreak: () => void
  skipBreak: () => void
  resetTimer: () => void
}

const TimerContext = createContext<TimerContextValue | null>(null)

export function TimerProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [focusMinutes, setFocusMinutes] = useState(0)
  const [breakTimeLeft, setBreakTimeLeft] = useState(0)
  const [breakTotal, setBreakTotal] = useState(0)
  const [completedSessions, setCompletedSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { setActiveBlockId, settings } = useApp()
  const defaultTimer = settings.defaultTimer ?? 25

  const baseElapsedRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)
  const breakElapsedRef = useRef(0)
  const breakStartRef = useRef<number | null>(null)
  const breakTotalRef = useRef(0)

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return clear
  }, [clear])

  const tick = useCallback(() => {
    if (phase === "focus" && startTimeRef.current !== null) {
      const delta = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const total = baseElapsedRef.current + delta
      setElapsed(total)
    } else if (phase === "break" && breakStartRef.current !== null && breakTotalRef.current > 0) {
      const delta = Math.floor((Date.now() - breakStartRef.current) / 1000)
      const consumed = breakElapsedRef.current + delta
      const remaining = Math.max(0, breakTotalRef.current - consumed)
      setBreakTimeLeft(remaining)
      if (remaining <= 0) {
        clear()
        setIsRunning(false)
        setPhase("idle")
      }
    }
  }, [phase, clear])

  useEffect(() => {
    clear()
    if (phase === "focus" && isRunning && !isPaused) {
      startTimeRef.current = Date.now()
      tick()
      intervalRef.current = setInterval(tick, 1000)
    } else if (phase === "break" && isRunning && !isPaused) {
      breakStartRef.current = Date.now()
      tick()
      intervalRef.current = setInterval(tick, 1000)
    }
    return clear
  }, [phase, isRunning, isPaused, tick, clear])

  useEffect(() => {
    if (phase !== "focus" || !isRunning || isPaused || defaultTimer <= 0) return
    const threshold = defaultTimer * 60
    const completed = Math.floor(elapsed / threshold)
    if (completed > completedSessions) {
      setCompletedSessions(completed)
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
        osc.start()
        osc.stop(ctx.currentTime + 0.6)
      } catch {}
    }
  }, [elapsed, isRunning, isPaused, phase, defaultTimer, completedSessions])

  const startFocus = useCallback((blockId: string) => {
    setActiveBlockId(blockId)
    baseElapsedRef.current = 0
    startTimeRef.current = null
    setElapsed(0)
    setFocusMinutes(0)
    setPhase("focus")
    setIsRunning(true)
    setIsPaused(false)
    setCompletedSessions(0)
  }, [setActiveBlockId])

  const pauseFocus = useCallback(() => {
    if (startTimeRef.current !== null) {
      baseElapsedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000)
      startTimeRef.current = null
    }
    setIsPaused(true)
  }, [])

  const resumeFocus = useCallback(() => {
    startTimeRef.current = Date.now()
    setIsPaused(false)
  }, [])

  const stopFocus = useCallback(() => {
    clear()
    let total = baseElapsedRef.current
    if (startTimeRef.current !== null) {
      total += Math.floor((Date.now() - startTimeRef.current) / 1000)
      startTimeRef.current = null
    }
    baseElapsedRef.current = 0
    setElapsed(0)
    setIsRunning(false)
    setIsPaused(false)
    return total
  }, [clear])

  const skipFocus = useCallback(() => {
    clear()
    baseElapsedRef.current = 0
    startTimeRef.current = null
    setElapsed(0)
    setPhase("idle")
    setIsRunning(false)
    setIsPaused(false)
    setFocusMinutes(0)
    setCompletedSessions(0)
  }, [clear])

  const setFocusMinutesState = useCallback((mins: number) => {
    setFocusMinutes(mins)
  }, [])

  const startBreak = useCallback((mins: number) => {
    const total = mins * 60
    breakTotalRef.current = total
    breakElapsedRef.current = 0
    breakStartRef.current = null
    setBreakTotal(total)
    setBreakTimeLeft(total)
    setPhase("break")
    setIsRunning(true)
    setIsPaused(false)
  }, [])

  const pauseBreak = useCallback(() => {
    if (breakStartRef.current !== null) {
      breakElapsedRef.current += Math.floor((Date.now() - breakStartRef.current) / 1000)
      breakStartRef.current = null
    }
    setIsPaused(true)
  }, [])

  const resumeBreak = useCallback(() => {
    breakStartRef.current = Date.now()
    setIsPaused(false)
  }, [])

  const skipBreak = useCallback(() => {
    clear()
    breakElapsedRef.current = 0
    breakStartRef.current = null
    breakTotalRef.current = 0
    setPhase("idle")
    setIsRunning(false)
    setIsPaused(false)
    setBreakTimeLeft(0)
    setFocusMinutes(0)
  }, [clear])

  const resetTimer = useCallback(() => {
    clear()
    baseElapsedRef.current = 0
    startTimeRef.current = null
    breakElapsedRef.current = 0
    breakStartRef.current = null
    breakTotalRef.current = 0
    setPhase("idle")
    setElapsed(0)
    setIsRunning(false)
    setIsPaused(false)
    setFocusMinutes(0)
    setBreakTimeLeft(0)
    setCompletedSessions(0)
  }, [clear])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const bMinutes = Math.floor(breakTimeLeft / 60)
  const bSeconds = breakTimeLeft % 60
  const bp = breakTotal > 0 ? ((breakTotal - breakTimeLeft) / breakTotal) * 100 : 0

  return (
    <TimerContext.Provider
      value={{
        phase, elapsed, isRunning, isPaused,
        focusMinutes, breakTimeLeft, breakTotal, completedSessions,
        minutes, seconds,
        breakMinutes: bMinutes, breakSeconds: bSeconds,
        breakProgress: bp,
        stopwatchProgress: defaultTimer > 0 ? ((elapsed % (defaultTimer * 60)) / (defaultTimer * 60)) * 100 : 0,
        startFocus, pauseFocus, resumeFocus, stopFocus,
        skipFocus, setFocusMinutes: setFocusMinutesState,
        startBreak, pauseBreak, resumeBreak, skipBreak,
        resetTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimerContext(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error("useTimerContext must be used within TimerProvider")
  return ctx
}
