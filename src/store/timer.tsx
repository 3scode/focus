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
    if (phase === "focus") {
      if (isRunning && !isPaused) {
        intervalRef.current = setInterval(() => {
          setElapsed((prev) => prev + 1)
        }, 1000)
      } else {
        clear()
      }
    } else if (phase === "break") {
      if (isRunning && !isPaused) {
        intervalRef.current = setInterval(() => {
          setBreakTimeLeft((prev) => {
            if (prev <= 1) {
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        clear()
      }
    }
    return clear
  }, [phase, isRunning, isPaused, clear])

  useEffect(() => {
    if (phase === "break" && breakTimeLeft <= 0 && isRunning) {
      clear()
      setIsRunning(false)
      setPhase("idle")
    }
  }, [phase, breakTimeLeft, isRunning, clear])

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
    setPhase("focus")
    setElapsed(0)
    setFocusMinutes(0)
    setIsRunning(true)
    setIsPaused(false)
    setCompletedSessions(0)
  }, [setActiveBlockId])

  const pauseFocus = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resumeFocus = useCallback(() => {
    setIsPaused(false)
  }, [])

  const stopFocus = useCallback(() => {
    clear()
    setIsRunning(false)
    setIsPaused(false)
    const total = elapsed
    setElapsed(0)
    return total
  }, [elapsed, clear])

  const skipFocus = useCallback(() => {
    clear()
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
    setPhase("break")
    setBreakTotal(mins * 60)
    setBreakTimeLeft(mins * 60)
    setIsRunning(true)
    setIsPaused(false)
  }, [])

  const pauseBreak = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resumeBreak = useCallback(() => {
    setIsPaused(false)
  }, [])

  const skipBreak = useCallback(() => {
    clear()
    setPhase("idle")
    setIsRunning(false)
    setIsPaused(false)
    setBreakTimeLeft(0)
    setFocusMinutes(0)
  }, [clear])

  const resetTimer = useCallback(() => {
    clear()
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
