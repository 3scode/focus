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
import { formatDate, formatDuration, calcDuration } from "@/lib/time"

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
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-[#8A8F98]"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)",
        }}
      >
        <span>Select a task</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full mt-1 left-0 right-0 z-20 max-h-60 overflow-y-auto rounded-xl"
            style={{
              background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.5)",
            }}
          >
            {todayBlocks.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#8A8F98] text-center">No tasks for today</div>
            ) : (
              todayBlocks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { onSelect(b.id); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.categoryColor }} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-[#EDEDEF] truncate block">{b.title}</span>
                    <span className="text-xs text-[#8A8F98]">{b.startTime} — {b.endTime}</span>
                  </div>
                  <span className="text-xs text-[#8A8F98]">{b.categoryName}</span>
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
  const { blocks, activeBlockId, setActiveBlockId, addFocusSession, categories } = useApp()
  const timerCtx = useTimerContext()

  const today = formatDate(new Date())
  const block = useMemo(() => blocks.find((b) => b.id === activeBlockId), [blocks, activeBlockId])

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }])), [categories])
  const blockCategory = block
    ? { name: catMap.get(block.categoryId)?.name ?? "", color: block.color ?? catMap.get(block.categoryId)?.color ?? "#6B7280" }
    : null

  const taskProgress = useMemo(() => {
    if (timerCtx.phase !== "focus" || !block) return { percent: 0, current: 0, total: 0 }

    const taskDurationMins = calcDuration(block.startTime, block.endTime)
    const totalFocusMins = block.focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
    const currentElapsedMins = Math.floor(timerCtx.elapsed / 60)
    const currentTotal = totalFocusMins + currentElapsedMins
    const percent = Math.round((currentTotal / taskDurationMins) * 100)

    return { percent, current: currentTotal, total: taskDurationMins }
  }, [timerCtx.phase, block, timerCtx.elapsed])

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
    setActiveBlockId(null)
  }, [timerCtx, saveAndReset, setActiveBlockId])

  const handleRestFocus = useCallback(async () => {
    const totalSeconds = timerCtx.stopFocus()
    const mins = Math.round(totalSeconds / 60)
    await saveAndReset(totalSeconds)
    const breakMins = Math.max(1, Math.round(mins * 5 / 25))
    timerCtx.startBreak(breakMins)
  }, [timerCtx, saveAndReset])

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
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/[0.05] text-[#8A8F98]" aria-label="Close">
              <X className="w-6 h-6" />
            </button>
          </div>

          {(phase === "idle") && !block && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 justify-center text-[#8A8F98]">
                <ListTodo className="w-5 h-5" />
                <span className="text-sm font-medium">Choose a task to focus on</span>
              </div>
              <TaskSelector onSelect={handleSelectTask} />
            </div>
          )}

          {(phase === "idle") && block && (
            <div className="text-center space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#EDEDEF]">{block.title}</p>
                <p className="text-xs text-[#8A8F98]">{block.startTime} — {block.endTime} • {formatDuration(block.startTime, block.endTime)}</p>
                {blockCategory && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs text-white mt-1" style={{ backgroundColor: blockCategory.color }}>
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
              <p className="text-sm font-medium text-[#EDEDEF]">{block?.title}</p>
              {blockCategory && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: blockCategory.color }}>
                  {blockCategory.name}
                </span>
              )}
            </div>
          )}

          {phase === "break" && (
            <div className="text-center space-y-2">
              <div className="flex items-center gap-2 justify-center text-[#F59E0B]">
                <Coffee className="w-5 h-5" />
                <p className="text-sm font-medium">Break Time</p>
              </div>
              <p className="text-xs text-[#8A8F98]">Focused for {timerCtx.focusMinutes}m — take a short break</p>
            </div>
          )}

          <div className="relative">
            <svg className="w-64 h-64 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={isBreakPhase ? "#F59E0B" : "#5E6AD2"}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - (isBreakPhase ? timerCtx.breakProgress : timerCtx.stopwatchProgress) / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: isBreakPhase ? "none" : "drop-shadow(0 0 8px rgba(94,106,210,0.3))",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tabular-nums tracking-tight text-[#EDEDEF]">{minutesStr}:{secondsStr}</span>
              <span className="text-sm text-[#8A8F98] mt-1">
                {isBreakPhase ? "Break" : timerRunning ? "Focus Time" : timerCtx.elapsed > 0 ? "Paused" : "Ready"}
                {phase === "focus" && timerCtx.completedSessions > 0 && <span className="ml-2">• {timerCtx.completedSessions} sesi</span>}
              </span>
            </div>
          </div>

          {phase === "focus" && block && (
            <div className="w-full max-w-xs space-y-2">
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(taskProgress.percent, 100)}%`, background: "#5E6AD2" }}
                />
              </div>
              <p className="text-xs text-[#8A8F98] text-center">
                Progress: {taskProgress.percent}% ({taskProgress.current}/{taskProgress.total} min)
              </p>
            </div>
          )}

          {phase !== "idle" && (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={isBreakPhase ? handleSkipBreak : handleSkipFocus}>
                <SkipForward className="w-4 h-4" /> Skip
              </Button>

              <button
                onClick={togglePlayPause}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
                style={{
                  background: "linear-gradient(to bottom, #5E6AD2, #4F5BCF)",
                  boxShadow: "0 0 0 1px rgba(94,106,210,0.5), 0 4px 20px rgba(94,106,210,0.4), inset 0 1px 0 0 rgba(255,255,255,0.2)",
                }}
                aria-label={isBreakPhase ? (isPaused ? "Play" : "Pause") : (isPaused ? "Play" : "Pause")}
              >
                {(timerRunning)
                  ? <Pause className="w-7 h-7 text-white" />
                  : <Play className="w-7 h-7 text-white ml-0.5" />
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
            <p className="text-xs text-[#8A8F98] text-center">
              Default timer: 25 min
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
