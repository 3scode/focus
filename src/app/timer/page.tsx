"use client"

import { useCallback, useMemo, useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Play, Pause, SkipForward, CheckCheck, ChevronDown, ListTodo, Coffee } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/Button"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"
import { useTimer } from "@/hooks/useTimer"
import { formatDate } from "@/lib/time"

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

  const focusDuration = block
    ? Math.min(Math.max(Math.round((new Date(`2000-01-01T${block.endTime}`).getTime() - new Date(`2000-01-01T${block.startTime}`).getTime()) / 60000), 1), defaultTimer)
    : defaultTimer

  const [phase, setPhase] = useState<Phase>("idle")
  const completedRef = useRef(false)

  const handleBreakComplete = useCallback(() => {
    completedRef.current = true
  }, [])

  const breakTimer = useTimer(breakDuration, handleBreakComplete)

  const handleFocusComplete = useCallback(async () => {
    if (!block) return
    const session = {
      id: uuidv4(),
      blockId: block.id,
      date: today,
      durationMinutes: focusDuration,
      completedAt: new Date().toISOString(),
    }
    await addFocusSession(session)
  }, [block, focusDuration, addFocusSession, today])

  const focusTimer = useTimer(focusDuration, handleFocusComplete)

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }])), [categories])
  const blockCategory = block ? catMap.get(block.categoryId) : null

  const handleSelectTask = useCallback((id: string) => {
    setActiveBlockId(id)
    setPhase("focus")
  }, [setActiveBlockId])

  useEffect(() => {
    if (phase === "focus" && activeBlockId) {
      focusTimer.reset(focusDuration)
      focusTimer.start()
    }
  }, [phase, activeBlockId]) // eslint-disable-line react-hooks/exhaustive-deps

  const goHome = useCallback(() => {
    setActiveBlockId(null)
    setPhase("idle")
    router.push("/")
  }, [router, setActiveBlockId])

  const handleStartFocus = useCallback(() => {
    setPhase("focus")
    focusTimer.start()
  }, [focusTimer])

  const handleFocusDone = useCallback(async () => {
    focusTimer.reset(focusDuration)
    if (block) {
      await handleFocusComplete()
    }
    completedRef.current = false
    setPhase("break")
    breakTimer.reset(breakDuration)
  }, [focusTimer, focusDuration, block, handleFocusComplete, breakTimer])

  const handleSkipFocus = useCallback(() => {
    focusTimer.reset(focusDuration)
    setPhase("idle")
  }, [focusTimer, focusDuration])

  const handleBreakDone = useCallback(() => {
    breakTimer.reset(breakDuration)
    setPhase("idle")
  }, [breakTimer])

  const handleSkipBreak = useCallback(() => {
    breakTimer.reset(breakDuration)
    setPhase("idle")
  }, [breakTimer])

  const handleClose = useCallback(() => {
    focusTimer.reset(focusDuration)
    breakTimer.reset(breakDuration)
    goHome()
  }, [focusTimer, focusDuration, breakTimer, goHome])

  const timer = phase === "break" ? breakTimer : focusTimer

  const togglePlayPause = useCallback(() => {
    if (!timer.isRunning) {
      timer.start()
    } else if (timer.isPaused) {
      timer.resume()
    } else {
      timer.pause()
    }
  }, [timer])

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
                <p className="text-caption text-text-secondary">{block.startTime} — {block.endTime}</p>
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
              <p className="text-caption text-text-secondary">Well done! Take a short break</p>
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
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - timer.progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tabular-nums tracking-tight">{minutesStr}:{secondsStr}</span>
              <span className="text-sm text-text-secondary mt-1">
                {phase === "break" ? "Break" : phase === "focus" && timer.isRunning && !timer.isPaused ? "Focus Time" : timer.isPaused ? "Paused" : "Ready"}
              </span>
            </div>
          </div>

          {phase !== "idle" && (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={phase === "break" ? handleSkipBreak : handleSkipFocus} disabled={!timer.isRunning && !timer.isPaused}>
                <SkipForward className="w-4 h-4" /> Skip
              </Button>

              <button
                onClick={togglePlayPause}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center
                  hover:bg-primary-hover transition-colors shadow-lg active:scale-95"
                aria-label={timer.isRunning && !timer.isPaused ? "Pause" : "Play"}
              >
                {timer.isRunning && !timer.isPaused ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-0.5" />
                )}
              </button>

              <Button variant="ghost" size="sm" onClick={phase === "break" ? handleBreakDone : handleFocusDone} disabled={!timer.isRunning && !timer.isPaused}>
                <CheckCheck className="w-4 h-4" /> Done
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
  return <TimerContent />
}
