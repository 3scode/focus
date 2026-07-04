"use client"

import { useRouter } from "next/navigation"
import { Play, Pause, Square, Timer, Coffee } from "lucide-react"
import { useTimerContext } from "@/store/timer"
import { useApp } from "@/store"

export function FloatingTimer() {
  const router = useRouter()
  const { phase, isRunning, isPaused, minutes, seconds, breakMinutes, breakSeconds, completedSessions, pauseFocus, resumeFocus, skipFocus, skipBreak, resetTimer } = useTimerContext()
  const { blocks } = useApp()
  const { activeBlockId } = useApp()

  if (phase === "idle") return null

  const block = blocks.find((b) => b.id === activeBlockId)
  const isBreak = phase === "break"

  const handleClick = () => {
    router.push("/timer")
  }

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-surface border border-border rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
      onClick={handleClick}
    >
      <div className={`flex items-center gap-2 ${isBreak ? "text-secondary" : "text-primary"}`}>
        {isBreak ? <Coffee className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
        <span className="font-mono text-sm font-bold tabular-nums">
          {isBreak
            ? `${String(breakMinutes).padStart(2, "0")}:${String(breakSeconds).padStart(2, "0")}`
            : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
        </span>
      </div>

      {block && (
        <span className="text-sm text-text-secondary max-w-[120px] truncate hidden sm:block">
          {block.title}
        </span>
      )}

      {!isBreak && completedSessions > 0 && (
        <span className="text-caption text-text-secondary hidden sm:block">{completedSessions + 1} sesi</span>
      )}

      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {isBreak ? (
          <button
            onClick={isRunning && !isPaused ? skipBreak : skipBreak}
            className="p-1 rounded-full hover:bg-border text-text-secondary transition-colors"
            aria-label="Skip break"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <>
            <button
              onClick={isRunning && !isPaused ? pauseFocus : resumeFocus}
              className="p-1 rounded-full hover:bg-border text-text-secondary transition-colors"
              aria-label={isRunning && !isPaused ? "Pause" : "Resume"}
            >
              {isRunning && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={skipFocus}
              className="p-1 rounded-full hover:bg-border text-text-secondary transition-colors"
              aria-label="Stop"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
