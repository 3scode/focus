"use client"

import { useCallback, useMemo, useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Play, Pause, SkipForward, CheckCheck, ChevronDown, ListTodo, Coffee } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Button } from "@/components/ui/Button"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"
import { useTimer } from "@/hooks/useTimer"
import { useStopwatch } from "@/hooks/useStopwatch"
import { formatDate, formatDuration } from "@/lib/time"

function TaskSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const { blocks, categories } = useApp()
  const today = formatDate(new Date())
  const todayBlocks = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }]))
    return blocks
      .filter((b) => b.date === today && !b.completed)
      .map((b) => ({
        ...b,
        categoryName: catMap.get(b.categoryId)?.name ?? "",
        categoryColor: catMap.get(b.categoryId)?.color ?? "#6B7280",
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [blocks, categories, today])

  const [open, setOpen] = useState(false)

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-background border border-border
          text-sm font-medium hover:border-text-secondary/30 transition-colors"
      >
        <span className="text-text-secondary">Select a task</span>
        <ChevronDown className="w-4 h-4 text-text-secondary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-surface border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {todayBlocks.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-secondary text-center">No tasks for today</div>
            ) : (
              todayBlocks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { onSelect(b.id); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-background transition-colors text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.categoryColor }} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{b.title}</span>
                    <span className="text-caption text-text-secondary">{b.startTime} — {b.endTime}</span>
                  </div>
                  <span className="text-caption text-text-secondary">{b.categoryName}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

type Phase = "idle" | "focus" | "break"

function TimerContent() {
  const router = useRouter()
  const { blocks, activeBlockId, setActiveBlockId, addFocusSession, categories, settings } = useApp()

  const today = formatDate(new Date())
  const defaultTimer = settings.defaultTimer ?? 25
  const breakDuration = settings.breakDuration ?? 5
  const block = useMemo(() => blocks.find((b) => b.id === activeBlockId), [blocks, activeBlockId])

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }])), [categories])
  const blockCategory = block ? catMap.get(block.categoryId) : null

  const [phase, setPhase] = useState<Phase>("idle")
  const [focusMinutes, setFocusMinutes] = useState(0)

  const stopwatch = useStopwatch()
  const breakTimer = useTimer(0)
  const completedSessionsRef = useRef(0)

  function playSessionComplete() {
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

  useEffect(() => {
    if (phase !== "focus" || !stopwatch.isRunning || defaultTimer <= 0) return
    const threshold = defaultTimer * 60
    const completed = Math.floor(stopwatch.elapsed / threshold)
    if (completed > completedSessionsRef.current) {
      completedSessionsRef.current = completed
      playSessionComplete()
    }
  }, [stopwatch.elapsed, stopwatch.isRunning, phase, defaultTimer])

  const goHome = useCallback(() => {
    setActiveBlockId(null)
    setPhase("idle")
    setFocusMinutes(0)
    router.push("/today")
  }, [router, setActiveBlockId])

  const handleSelectTask = useCallback((id: string) => {
    setActiveBlockId(id)
    setPhase("focus")
    setFocusMinutes(0)
  }, [setActiveBlockId])

  const handleStartFocus = useCallback(() => {
    setPhase("focus")
    stopwatch.start()
  }, [stopwatch])

  const handleFocusDone = useCallback(async () => {
    const totalSeconds = stopwatch.stop()
    const mins = Math.round(totalSeconds / 60)
    if (mins < 1 || !block) {
      setPhase("idle")
      return
    }

    const session = {
      id: uuidv4(),
      blockId: block.id,
      date: today,
      durationMinutes: mins,
      completedAt: new Date().toISOString(),
    }
    await addFocusSession(session)
    setFocusMinutes(mins)

    const breakMins = Math.max(1, Math.round(mins * breakDuration / defaultTimer))
    breakTimer.reset(breakMins)
    breakTimer.start()
    setPhase("break")
  }, [stopwatch, block, today, addFocusSession, breakDuration, defaultTimer, breakTimer])

  const handleSkipFocus = useCallback(() => {
    stopwatch.reset()
    completedSessionsRef.current = 0
    setPhase("idle")
    setFocusMinutes(0)
  }, [stopwatch])

  const handleBreakDone = useCallback(() => {
    breakTimer.reset(0)
    setPhase("idle")
    setFocusMinutes(0)
  }, [breakTimer])

  const handleSkipBreak = useCallback(() => {
    breakTimer.reset(0)
    setPhase("idle")
    setFocusMinutes(0)
  }, [breakTimer])

  const handleClose = useCallback(() => {
    stopwatch.reset()
    breakTimer.reset(0)
    goHome()
  }, [stopwatch, breakTimer, goHome])

  const isBreakPhase = phase === "break"
  const timer = isBreakPhase ? breakTimer : stopwatch

  const togglePlayPause = useCallback(() => {
    if (isBreakPhase) {
      if (!breakTimer.isRunning) {
        breakTimer.start()
      } else if (breakTimer.isPaused) {
        breakTimer.resume()
      } else {
        breakTimer.pause()
      }
    } else {
      if (!stopwatch.isRunning) {
        stopwatch.start()
      } else {
        stopwatch.pause()
      }
    }
  }, [isBreakPhase, breakTimer, stopwatch])

  const minutesStr = String(timer.minutes).padStart(2, "0")
  const secondsStr = String(timer.seconds).padStart(2, "0")

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center justify-center pb-16 md:pb-0 px-4">
        <div className="flex flex-col items-center gap-8 max-w-sm w-full">
          <div className="self-end">
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-border text-text-secondary" aria-label="Close">
              <X className="w-6 h-6" />
            </button>
          </div>

          {phase === "idle" && !block && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 justify-center text-text-secondary">
                <ListTodo className="w-5 h-5" />
                <span className="text-sm font-medium">Choose a task to focus on</span>
              </div>
              <TaskSelector onSelect={handleSelectTask} />
            </div>
          )}

          {phase === "idle" && block && (
            <div className="text-center space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">{block.title}</p>
                <p className="text-caption text-text-secondary">{block.startTime} — {block.endTime} • {formatDuration(block.startTime, block.endTime)}</p>
                {blockCategory && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-caption text-white mt-1" style={{ backgroundColor: blockCategory.color }}>
                    {blockCategory.name}
                  </span>
                )}
              </div>
              <Button onClick={handleStartFocus} size="lg">
                <Play className="w-5 h-5" /> Start Focus
              </Button>
            </div>
          )}

          {phase === "focus" && (
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">{block?.title}</p>
              {blockCategory && (
                <span className="inline-block px-2 py-0.5 rounded-full text-caption text-white" style={{ backgroundColor: blockCategory.color }}>
                  {blockCategory.name}
                </span>
              )}
            </div>
          )}

          {phase === "break" && (
            <div className="text-center space-y-2">
              <div className="flex items-center gap-2 justify-center text-secondary">
                <Coffee className="w-5 h-5" />
                <p className="text-sm font-medium">Break Time</p>
              </div>
              <p className="text-caption text-text-secondary">Focused for {focusMinutes}m — take a short break</p>
            </div>
          )}

          <div className="relative">
            <svg className="w-64 h-64 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={phase === "break" ? "var(--color-secondary)" : "var(--color-primary)"}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - (isBreakPhase ? breakTimer.progress : (defaultTimer > 0 ? (stopwatch.elapsed % (defaultTimer * 60)) / (defaultTimer * 60) * 100 : 0)) / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tabular-nums tracking-tight">{minutesStr}:{secondsStr}</span>
              <span className="text-sm text-text-secondary mt-1">
                {phase === "break" ? "Break" : stopwatch.isRunning ? "Focus Time" : stopwatch.elapsed > 0 ? "Paused" : "Ready"}
                {phase === "focus" && completedSessionsRef.current > 0 && <span className="ml-2">• {completedSessionsRef.current} sesi</span>}
              </span>
            </div>
          </div>

          {phase !== "idle" && (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={phase === "break" ? handleSkipBreak : handleSkipFocus} disabled={phase === "break" && !breakTimer.isRunning}>
                <SkipForward className="w-4 h-4" /> Skip
              </Button>

              <button
                onClick={togglePlayPause}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center
                  hover:bg-primary-hover transition-colors shadow-lg active:scale-95"
                aria-label={isBreakPhase ? (breakTimer.isRunning && !breakTimer.isPaused ? "Pause" : "Play") : (stopwatch.isRunning ? "Pause" : "Play")}
              >
                {isBreakPhase
                  ? (breakTimer.isRunning && !breakTimer.isPaused ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />)
                  : (stopwatch.isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />)
                }
              </button>

              <Button variant="ghost" size="sm" onClick={phase === "break" ? handleBreakDone : handleFocusDone} disabled={phase === "break" && !timer.isRunning}>
                <CheckCheck className="w-4 h-4" /> {phase === "focus" ? "Stop" : "Done"}
              </Button>
            </div>
          )}

          {phase === "idle" && !block && (
            <p className="text-caption text-text-secondary text-center">
              Default timer: {defaultTimer} min
            </p>
          )}
        </div>
      </main>
      <BottomTab />
    </div>
  )
}

export default function TimerPage() {
  return (
    <AuthGuard>
      <TimerContent />
    </AuthGuard>
  )
}
