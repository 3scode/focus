"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, Square, Timer, Coffee } from "lucide-react"
import { useTimerContext } from "@/store/timer"
import { useApp } from "@/store"

export function FloatingTimer() {
  const router = useRouter()
  const { phase, isRunning, isPaused, minutes, seconds, breakMinutes, breakSeconds, completedSessions, pauseFocus, resumeFocus, skipFocus, skipBreak } = useTimerContext()
  const { blocks } = useApp()
  const { activeBlockId } = useApp()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  if (!mounted || phase === "idle") return null

  const block = blocks.find((b) => b.id === activeBlockId)
  const isBreak = phase === "break"

  const handleClick = () => {
    router.push("/timer")
  }

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer animate-scale-in"
      onClick={handleClick}
      style={{
        background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.4), 0 0 40px rgba(94,106,210,0.08)",
      }}
    >
      <div className={`flex items-center gap-2 ${isBreak ? "text-[#F59E0B]" : "text-[#5E6AD2]"}`}>
        {isBreak ? <Coffee className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
        <span className="font-mono text-sm font-bold tabular-nums">
          {isBreak
            ? `${String(breakMinutes).padStart(2, "0")}:${String(breakSeconds).padStart(2, "0")}`
            : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
        </span>
      </div>

      {block && (
        <span className="text-sm text-[#8A8F98] max-w-[120px] truncate hidden sm:block">
          {block.title}
        </span>
      )}

      {!isBreak && completedSessions > 0 && (
        <span className="text-xs text-[#8A8F98] hidden sm:block">{completedSessions + 1} sesi</span>
      )}

      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {isBreak ? (
          <button
            onClick={skipBreak}
            className="p-1 rounded-full hover:bg-white/[0.08] text-[#8A8F98] transition-colors"
            aria-label="Skip break"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <>
            <button
              onClick={isRunning && !isPaused ? pauseFocus : resumeFocus}
              className="p-1 rounded-full hover:bg-white/[0.08] text-[#8A8F98] transition-colors"
              aria-label={isRunning && !isPaused ? "Pause" : "Resume"}
            >
              {isRunning && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={skipFocus}
              className="p-1 rounded-full hover:bg-white/[0.08] text-[#8A8F98] transition-colors"
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
