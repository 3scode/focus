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

const PERSIST_KEY = "time-blocking:timer"

interface PersistedTimer {
  phase: Phase
  baseElapsed: number
  startTimestamp: number | null
  breakElapsed: number
  breakStartTimestamp: number | null
  breakTotal: number
  focusMinutes: number
  completedSessions: number
  activeBlockId: string | null
  isPaused: boolean
}

function persist(t: PersistedTimer) {
  try { localStorage.setItem(PERSIST_KEY, JSON.stringify(t)) } catch {}
}

function load(): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function clearPersist() {
  try { localStorage.removeItem(PERSIST_KEY) } catch {}
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const saved = load()

  const [phase, setPhase] = useState<Phase>(saved?.phase ?? "idle")
  const [elapsed, setElapsed] = useState(() => {
    if (saved?.phase === "focus" && saved.startTimestamp !== null) {
      return saved.baseElapsed + Math.floor((Date.now() - saved.startTimestamp) / 1000)
    }
    return saved?.baseElapsed ?? 0
  })
  const [isRunning, setIsRunning] = useState(() => {
    if (!saved) return false
    if (saved.phase === "idle") return false
    return !saved.isPaused
  })
  const [isPaused, setIsPaused] = useState(saved?.isPaused ?? false)
  const [focusMinutes, setFocusMinutes] = useState(saved?.focusMinutes ?? 0)
  const [breakTimeLeft, setBreakTimeLeft] = useState(() => {
    if (saved?.phase === "break" && saved.breakStartTimestamp !== null) {
      const consumed = saved.breakElapsed + Math.floor((Date.now() - saved.breakStartTimestamp) / 1000)
      return Math.max(0, saved.breakTotal - consumed)
    }
    if (saved?.phase === "break") return saved.breakTotal - saved.breakElapsed
    return 0
  })
  const [breakTotal, setBreakTotal] = useState(saved?.breakTotal ?? 0)
  const [completedSessions, setCompletedSessions] = useState(saved?.completedSessions ?? 0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { activeBlockId, setActiveBlockId, settings } = useApp()
  const defaultTimer = settings.defaultTimer ?? 25
  const sessionTimerRef = useRef(defaultTimer)
  const [sessionTimer, setSessionTimer] = useState(defaultTimer)

  const baseElapsedRef = useRef(saved?.baseElapsed ?? 0)
  const startTimeRef = useRef<number | null>(saved?.startTimestamp ?? null)
  const breakElapsedRef = useRef(saved?.breakElapsed ?? 0)
  const breakStartRef = useRef<number | null>(saved?.breakStartTimestamp ?? null)
  const breakTotalRef = useRef(saved?.breakTotal ?? 0)

  useEffect(() => {
    if (saved?.activeBlockId) {
      setActiveBlockId(saved.activeBlockId)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return clear
  }, [clear])

  const persistCurrent = useCallback(() => {
    persist({
      phase,
      baseElapsed: baseElapsedRef.current,
      startTimestamp: startTimeRef.current,
      breakElapsed: breakElapsedRef.current,
      breakStartTimestamp: breakStartRef.current,
      breakTotal: breakTotalRef.current,
      focusMinutes,
      completedSessions,
      activeBlockId,
      isPaused,
    })
  }, [phase, focusMinutes, completedSessions, isPaused, activeBlockId])

  const lastPersistRef = useRef(0)

  useEffect(() => {
    if (phase === "idle") return
    const now = Date.now()
    if (now - lastPersistRef.current >= 5000) {
      lastPersistRef.current = now
      persistCurrent()
    }
  })

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
      if (startTimeRef.current === null) startTimeRef.current = Date.now()
      tick()
      intervalRef.current = setInterval(tick, 1000)
    } else if (phase === "break" && isRunning && !isPaused) {
      if (breakStartRef.current === null) breakStartRef.current = Date.now()
      tick()
      intervalRef.current = setInterval(tick, 1000)
    }
    return clear
  }, [phase, isRunning, isPaused, tick, clear])

  useEffect(() => {
    if (phase !== "focus" || !isRunning || isPaused || sessionTimerRef.current <= 0) return
    const threshold = sessionTimerRef.current * 60
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
  }, [elapsed, isRunning, isPaused, phase, completedSessions])

  const startFocus = useCallback((blockId: string) => {
    setActiveBlockId(blockId)
    const timer = defaultTimer
    sessionTimerRef.current = timer
    setSessionTimer(timer)
    baseElapsedRef.current = 0
    startTimeRef.current = null
    setElapsed(0)
    setFocusMinutes(0)
    setPhase("focus")
    setIsRunning(true)
    setIsPaused(false)
    setCompletedSessions(0)
  }, [setActiveBlockId, defaultTimer])

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
    setPhase("idle")
    setIsRunning(false)
    setIsPaused(false)
    setCompletedSessions(0)
    clearPersist()
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
    clearPersist()
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
    clearPersist()
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
    clearPersist()
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
        stopwatchProgress: sessionTimer > 0 ? ((elapsed % (sessionTimer * 60)) / (sessionTimer * 60)) * 100 : 0,
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
