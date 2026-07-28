"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, Square, Timer, Coffee, GripHorizontal } from "lucide-react"
import { useTimerContext } from "@/store/timer"

const POS_KEY = "time-blocking:floating-pos"

function loadPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { x: -1, y: -1 }
}

export function FloatingTimer() {
  const router = useRouter()
  const { phase, isRunning, isPaused, minutes, seconds, breakMinutes, breakSeconds, pauseFocus, resumeFocus, skipFocus, skipBreak } = useTimerContext()
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState(loadPos)
  const dragging = useRef(false)
  const wasDragged = useRef(false)
  const start = useRef({ x: 0, y: 0, left: 0, top: 0 })
  const posRef = useRef(pos)
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    posRef.current = pos
  }, [pos])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    dragging.current = true
    wasDragged.current = false
    const rect = elRef.current?.getBoundingClientRect()
    start.current = {
      x: e.clientX,
      y: e.clientY,
      left: rect?.left ?? 0,
      top: rect?.top ?? 0,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    wasDragged.current = true
    const newPos = { x: start.current.left + dx, y: start.current.top + dy }
    setPos(newPos)
    posRef.current = newPos
  }, [])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(posRef.current))
    } catch {}
  }, [])

  if (!mounted || phase === "idle") return null

  const isBreak = phase === "break"

  const handleClick = () => {
    if (!wasDragged.current) router.push("/timer")
  }

  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 50,
    background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.4), 0 0 40px rgba(94,106,210,0.08)",
    touchAction: "none",
    userSelect: "none",
  }

  if (pos.x >= 0) {
    style.left = pos.x
    style.top = pos.y
  } else {
    style.bottom = 16
    style.left = "50%"
    style.transform = "translateX(-50%)"
  }

  return (
    <div
      ref={elRef}
      className="flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer animate-scale-in"
      style={style}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <GripHorizontal className="w-3.5 h-3.5 text-[#8A8F98] shrink-0" />

      <div className={`flex items-center gap-1.5 ${isBreak ? "text-[#F59E0B]" : "text-[#5E6AD2]"}`}>
        {isBreak ? <Coffee className="w-3.5 h-3.5" /> : <Timer className="w-3.5 h-3.5" />}
        <span className="font-mono text-sm font-bold tabular-nums">
          {isBreak
            ? `${String(breakMinutes).padStart(2, "0")}:${String(breakSeconds).padStart(2, "0")}`
            : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
        </span>
      </div>

      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {isBreak ? (
          <button
            onClick={skipBreak}
            className="p-1 rounded-full hover:bg-white/[0.08] text-[#8A8F98] transition-colors"
            aria-label="Skip break"
          >
            <Square className="w-3 h-3" />
          </button>
        ) : (
          <>
            <button
              onClick={isRunning && !isPaused ? pauseFocus : resumeFocus}
              className="p-1 rounded-full hover:bg-white/[0.08] text-[#8A8F98] transition-colors"
              aria-label={isRunning && !isPaused ? "Pause" : "Resume"}
            >
              {isRunning && !isPaused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={skipFocus}
              className="p-1 rounded-full hover:bg-white/[0.08] text-[#8A8F98] transition-colors"
              aria-label="Stop"
            >
              <Square className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
