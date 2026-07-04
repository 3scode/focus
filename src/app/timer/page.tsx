"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { X, Play, Pause, SkipForward, CheckCheck, ChevronDown, ListTodo, Coffee } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Button } from "@/components/ui/Button"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"
import { useTimerContext } from "@/store/timer"
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
        categoryColor: b.color ?? catMap.get(b.categoryId)?.color ?? "#6B7280",
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

function TimerContent() {
  const router = useRouter()
  const { blocks, activeBlockId, setActiveBlockId, addFocusSession, categories, settings } = useApp()
  const timerCtx = useTimerContext()

  const today = formatDate(new Date())
  const defaultTimer = settings.defaultTimer ?? 25
  const breakDuration = settings.breakDuration ?? 5
  const block = useMemo(() => blocks.find((b) => b.id === activeBlockId), [blocks, activeBlockId])

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }])), [categories])
  const blockCategory = block
    ? { name: catMap.get(block.categoryId)?.name ?? "", color: block.color ?? catMap.get(block.categoryId)?.color ?? "#6B7280" }
    : null

  const goHome = useCallback(() => {
    timerCtx.resetTimer()
    setActiveBlockId(null)
    router.push("/today")
  }, [timerCtx, setActiveBlockId, router])

  const handleSelectTask = useCallback((id: string) => {
    timerCtx.startFocus(id)
  }, [timerCtx])

  const handleStartFocus = useCallback(() => {
    if (activeBlockId) timerCtx.startFocus(activeBlockId)
  }, [timerCtx, activeBlockId])

  const saveAndReset = useCallback(async (totalSeconds: number) => {
    const mins = Math.round(totalSeconds / 60)
    if (mins < 1 || !block) return false
    const session = {
      id: uuidv4(),
      blockId: block.id,
      date: today,
      durationMinutes: mins,
      completedAt: new Date().toISOString(),
    }
    await addFocusSession(session)
    timerCtx.setFocusMinutes(mins)
    return true
  }, [block, today, addFocusSession, timerCtx])

  const handleStopFocus = useCallback(async () => {
    const totalSeconds = timerCtx.stopFocus()
    await saveAndReset(totalSeconds)
    timerCtx.resetTimer()
  }, [timerCtx, saveAndReset])

  const handleRestFocus = useCallback(async () => {
    const totalSeconds = timerCtx.stopFocus()
    const mins = Math.round(totalSeconds / 60)
    const saved = await saveAndReset(totalSeconds)
    if (!saved) return
    const breakMins = Math.max(1, Math.round(mins * breakDuration / defaultTimer))
    timerCtx.startBreak(breakMins)
  }, [timerCtx, saveAndReset, breakDuration, defaultTimer])

  const handleSkipFocus = useCallback(() => {
    timerCtx.skipFocus()
  }, [timerCtx])

  const handleSkipBreak = useCallback(() => {
    timerCtx.skipBreak()
  }, [timerCtx])

  const handleClose = useCallback(() => {
    timerCtx.resetTimer()
    goHome()
  }, [timerCtx, goHome])

  const togglePlayPause = useCallback(() => {
    if (timerCtx.phase === "break") {
      if (timerCtx.isPaused) {
        timerCtx.resumeBreak()
      } else {
        timerCtx.pauseBreak()
      }
    } else {
      if (timerCtx.isPaused) {
        timerCtx.resumeFocus()
      } else {
        timerCtx.pauseFocus()
      }
    }
  }, [timerCtx])

  const phase = timerCtx.phase
  const isBreakPhase = phase === "break"
  const isPaused = timerCtx.isPaused
  const timerRunning = timerCtx.isRunning && !timerCtx.isPaused

  const minutesStr = String(isBreakPhase ? timerCtx.breakMinutes : timerCtx.minutes).padStart(2, "0")
  const secondsStr = String(isBreakPhase ? timerCtx.breakSeconds : timerCtx.seconds).padStart(2, "0")

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

          {(phase === "idle") && !block && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 justify-center text-text-secondary">
                <ListTodo className="w-5 h-5" />
                <span className="text-sm font-medium">Choose a task to focus on</span>
              </div>
              <TaskSelector onSelect={handleSelectTask} />
            </div>
          )}

          {(phase === "idle") && block && (
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
              <p className="text-caption text-text-secondary">Focused for {timerCtx.focusMinutes}m — take a short break</p>
            </div>
          )}

          <div className="relative">
            <svg className="w-64 h-64 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={isBreakPhase ? "var(--color-secondary)" : "var(--color-primary)"}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - (isBreakPhase ? timerCtx.breakProgress : timerCtx.stopwatchProgress) / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tabular-nums tracking-tight">{minutesStr}:{secondsStr}</span>
              <span className="text-sm text-text-secondary mt-1">
                {isBreakPhase ? "Break" : timerRunning ? "Focus Time" : timerCtx.elapsed > 0 ? "Paused" : "Ready"}
                {phase === "focus" && timerCtx.completedSessions > 0 && <span className="ml-2">• {timerCtx.completedSessions} sesi</span>}
              </span>
            </div>
          </div>

          {phase !== "idle" && (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={isBreakPhase ? handleSkipBreak : handleSkipFocus}>
                <SkipForward className="w-4 h-4" /> Skip
              </Button>

              <button
                onClick={togglePlayPause}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center
                  hover:bg-primary-hover transition-colors shadow-lg active:scale-95"
                aria-label={isBreakPhase ? (isPaused ? "Play" : "Pause") : (isPaused ? "Play" : "Pause")}
              >
                {(timerRunning)
                  ? <Pause className="w-7 h-7" />
                  : <Play className="w-7 h-7 ml-0.5" />
                }
              </button>

              {!isBreakPhase && (
                <Button variant="ghost" size="sm" onClick={handleRestFocus}>
                  <Coffee className="w-4 h-4" /> Rest
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={isBreakPhase ? handleSkipBreak : handleStopFocus}>
                <CheckCheck className="w-4 h-4" /> {isBreakPhase ? "Done" : "Stop"}
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
