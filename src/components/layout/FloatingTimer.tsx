"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { Play, Pause, Square, Timer, Coffee, GripHorizontal, ExternalLink } from "lucide-react"
import { useTimerContext } from "@/store/timer"
import { useApp } from "@/store"
import { formatDate } from "@/lib/time"

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
  const { phase, isRunning, isPaused, elapsed, minutes, seconds, breakMinutes, breakSeconds, pauseFocus, resumeFocus, skipFocus, skipBreak, stopFocus, setFocusMinutes, startBreak } = useTimerContext()
  const { blocks, activeBlockId, addFocusSession } = useApp()
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

  const activeBlock = useMemo(() => blocks.find(b => b.id === activeBlockId), [blocks, activeBlockId])

  const activeBlockRef = useRef(activeBlock)

  useEffect(() => {
    activeBlockRef.current = activeBlock
  }, [activeBlock])

  const displayTime = useMemo(() => {
    if (phase === "break") return { m: breakMinutes, s: breakSeconds }
    if (activeBlock) {
      const priorSecs = activeBlock.focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0) * 60
      const totalSecs = phase === "idle" ? priorSecs : priorSecs + elapsed
      return { m: Math.floor(totalSecs / 60), s: totalSecs % 60 }
    }
    return { m: minutes, s: seconds }
  }, [phase, breakMinutes, breakSeconds, activeBlock, elapsed, minutes, seconds])

  const displayTimeRef = useRef(displayTime)
  const phaseRef = useRef(phase)
  const isPausedRef = useRef(isPaused)
  const activeBlockIdRef = useRef(activeBlockId)
  const pauseFocusRef = useRef(pauseFocus)
  const resumeFocusRef = useRef(resumeFocus)
  const skipFocusRef = useRef(skipFocus)
  const stopFocusRef = useRef(stopFocus)
  const skipBreakRef = useRef(skipBreak)
  const setFocusMinutesRef = useRef(setFocusMinutes)
  const startBreakRef = useRef(startBreak)
  const addFocusSessionRef = useRef(addFocusSession)
  const bcRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    displayTimeRef.current = displayTime
    phaseRef.current = phase
    isPausedRef.current = isPaused
    activeBlockIdRef.current = activeBlockId
    pauseFocusRef.current = pauseFocus
    resumeFocusRef.current = resumeFocus
    skipFocusRef.current = skipFocus
    stopFocusRef.current = stopFocus
    skipBreakRef.current = skipBreak
    setFocusMinutesRef.current = setFocusMinutes
    startBreakRef.current = startBreak
    addFocusSessionRef.current = addFocusSession
  })

  useEffect(() => {
    const bc = new BroadcastChannel("focus-timer")
    bcRef.current = bc

    const stateInterval = setInterval(() => {
      bc.postMessage({
        type: "state",
        m: displayTimeRef.current.m,
        s: displayTimeRef.current.s,
        phase: phaseRef.current,
        isPaused: isPausedRef.current,
        activeBlockId: activeBlockIdRef.current,
      })
    }, 200)

    bc.postMessage({
      type: "state",
      m: displayTimeRef.current.m,
      s: displayTimeRef.current.s,
      phase: phaseRef.current,
      isPaused: isPausedRef.current,
      activeBlockId: activeBlockIdRef.current,
    })

    bc.onmessage = async (e) => {
      if (!e.data.command) return
      const { command } = e.data
      const block = activeBlockRef.current
      switch (command) {
        case "pause":
          pauseFocusRef.current()
          break
        case "resume":
          resumeFocusRef.current()
          break
        case "skip":
          skipFocusRef.current()
          break
        case "stop": {
          const totalSecs = stopFocusRef.current()
          const mins = Math.round(totalSecs / 60)
          if (mins > 0 && block) {
            await addFocusSessionRef.current({
              id: uuidv4(),
              blockId: block.id,
              date: formatDate(new Date()),
              durationMinutes: mins,
              completedAt: new Date().toISOString(),
            })
            setFocusMinutesRef.current(mins)
          }
          break
        }
        case "rest": {
          const totalSecs = stopFocusRef.current()
          const mins = Math.round(totalSecs / 60)
          if (mins > 0 && block) {
            await addFocusSessionRef.current({
              id: uuidv4(),
              blockId: block.id,
              date: formatDate(new Date()),
              durationMinutes: mins,
              completedAt: new Date().toISOString(),
            })
            setFocusMinutesRef.current(mins)
            startBreakRef.current(Math.max(1, Math.round(mins * 5 / 25)))
          }
          break
        }
        case "skipBreak":
        case "done":
          skipBreakRef.current()
          break
      }
    }
    return () => {
      bcRef.current = null
      bc.close()
      clearInterval(stateInterval)
    }
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

  const handlePopOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    const initM = displayTimeRef.current.m
    const initS = displayTimeRef.current.s
    const initPhase = phaseRef.current
    const initPaused = isPausedRef.current
    const initBlockId = activeBlockIdRef.current ?? ""

    const popup = window.open("", "focus-timer", "width=320,height=260,popup=1")
    if (!popup) return

    const d = popup.document
    d.open()
    d.write(`<!DOCTYPE html><html><head><title>Focus</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0c;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:12px;font-family:system-ui,sans-serif;padding:12px}
.p{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:999px;background:linear-gradient(to bottom,rgba(255,255,255,0.08),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.06);box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 4px 20px rgba(0,0,0,0.4)}
.t{font-family:'Courier New',monospace;font-size:24px;font-weight:700;color:#EDEDEF;letter-spacing:-0.5px;tabular-nums}
.l{font-size:12px;color:#8A8F98;text-align:center}
.d{width:10px;height:10px;border-radius:50%;background:#5E6AD2}
.b .d{background:#F59E0B}
.btns{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.btn{padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#EDEDEF;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif;transition:background 0.1s}
.btn:hover{background:rgba(255,255,255,0.1)}
.btn-primary{background:#5E6AD2;border-color:#5E6AD2}.btn-primary:hover{background:#4F5BCF}
.btn-amber{background:#F59E0B;border-color:#F59E0B;color:#0a0a0c}.btn-amber:hover{background:#D97706}
</style></head><body>
<div id="a" style="display:flex;flex-direction:column;align-items:center;gap:12px">
<div class="p" id="p"><div class="d"></div><span class="t" id="tm">00:00</span></div>
<div class="l" id="lb">Ready</div>
<div class="btns" id="btns"></div>
</div>
<script>
(function(m,s,p,ps,id){
var bc=new BroadcastChannel("focus-timer");
function send(cmd){bc.postMessage({command:cmd})}
function btn(text,cls,cmd){var e=document.createElement("button");e.className="btn"+(cls?" "+cls:"");e.textContent=text;e.onclick=function(){send(cmd)};return e}
function apply(s){
var tm=document.getElementById("tm"),lb=document.getElementById("lb"),btns=document.getElementById("btns"),pe=document.getElementById("p");
if(!tm)return;
if(s.phase==="break"){
tm.textContent=String(s.m).padStart(2,"0")+":"+String(s.s).padStart(2,"0");
lb.textContent="Break";
pe.className="p b";
btns.textContent="";btns.appendChild(btn("Done","btn-amber","done"));
}else if(s.phase==="idle"){
tm.textContent=String(s.m).padStart(2,"0")+":"+String(s.s).padStart(2,"0");
lb.textContent="Ready";
pe.className="p";
btns.textContent="";
if(s.activeBlockId)btns.appendChild(btn("Start","btn-primary","resume"));
}else{
tm.textContent=String(s.m).padStart(2,"0")+":"+String(s.s).padStart(2,"0");
lb.textContent=s.isPaused?"Paused":"Focus Time";
pe.className="p";
btns.textContent="";
btns.appendChild(btn(s.isPaused?"Play":"Pause","",s.isPaused?"resume":"pause"));
btns.appendChild(btn("Skip","","skip"));
btns.appendChild(btn("Stop","","stop"));
btns.appendChild(btn("Rest","btn-primary","rest"));
}
}
apply({m:m,s:s,phase:p,isPaused:ps,activeBlockId:id});
bc.onmessage=function(e){if(e.data.type==="state")apply(e.data)};
})(${initM},${initS},"${initPhase}",${initPaused},"${initBlockId}");
</script></body></html>`)
    d.close()

    bcRef.current?.postMessage({
      type: "state",
      m: initM,
      s: initS,
      phase: initPhase,
      isPaused: initPaused,
      activeBlockId: initBlockId,
    })
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
      className="flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer animate-scale-in"
      style={style}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <GripHorizontal className="w-4 h-4 text-[#8A8F98] shrink-0" />

      <div className={`flex items-center gap-1.5 ${isBreak ? "text-[#F59E0B]" : "text-[#5E6AD2]"}`}>
        {isBreak ? <Coffee className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
        <span className="font-mono text-base font-bold tabular-nums">
          {`${String(displayTime.m).padStart(2, "0")}:${String(displayTime.s).padStart(2, "0")}`}
        </span>
      </div>

      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {isBreak ? (
          <button
            onClick={skipBreak}
            className="p-1.5 rounded-full hover:bg-white/[0.08] text-[#8A8F98] transition-colors"
            aria-label="Skip break"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <>
            <button
              onClick={isRunning && !isPaused ? pauseFocus : resumeFocus}
              className="p-1.5 rounded-full hover:bg-white/[0.08] text-[#8A8F98] transition-colors"
              aria-label={isRunning && !isPaused ? "Pause" : "Resume"}
            >
              {isRunning && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={skipFocus}
              className="p-1.5 rounded-full hover:bg-white/[0.08] text-[#8A8F98] transition-colors"
              aria-label="Stop"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      <button
        onClick={handlePopOut}
        onPointerDown={(e) => e.stopPropagation()}
        className="p-1.5 rounded-full hover:bg-white/[0.08] text-[#5E6AD2] transition-colors opacity-60 hover:opacity-100"
        aria-label="Open in window"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
