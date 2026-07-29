"use client"

import { useMemo, useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { addDays } from "date-fns/addDays"
import { format } from "date-fns/format"
import { parseISO } from "date-fns/parseISO"
import {
  CheckCircle2, Circle, ArrowRight, ChevronLeft, ChevronRight,
  Clock, Target, Timer, Zap, CalendarArrowUp, Sparkles,
  Brain, Dumbbell, BookOpen, Laptop, Music, Palette,
  Coffee, MessageSquare, Heart, Flame, ListChecks, X,
} from "lucide-react"
import type { Block, Category } from "@/types"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Button } from "@/components/ui/Button"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"
import { useBlocksByDate } from "@/hooks/useBlocks"
import { useTimerContext } from "@/store/timer"
import { formatDisplayDate, formatDate, calcDuration, formatDuration } from "@/lib/time"
import { subDays } from "date-fns/subDays"
import { startOfDay } from "date-fns/startOfDay"
import { toast } from "sonner"

const ICON_MAP: Record<string, typeof Brain> = {
  work: Laptop, study: BookOpen, health: Heart, fitness: Dumbbell,
  creative: Palette, music: Music, social: MessageSquare, break: Coffee,
}

function getStreak(habitId: string, records: { habitId: string; date: string; status?: string }[]): number {
  const today = startOfDay(new Date())
  let streak = 0
  const todayStr = formatDate(today)
  const ok = (r: { habitId: string; date: string; status?: string }) => (r.status ?? "completed") !== "failed"
  const hasToday = records.some((r) => r.habitId === habitId && r.date === todayStr && ok(r))
  for (let i = hasToday ? 0 : 1; i < 365; i++) {
    const day = subDays(today, i)
    const dayStr = formatDate(day)
    if (records.some((r) => r.habitId === habitId && r.date === dayStr && ok(r))) streak++
    else break
  }
  return streak
}

function getCategoryIcon(categories: Category[], categoryId: string) {
  const cat = categories.find((c) => c.id === categoryId)
  const Icon = ICON_MAP[cat?.name?.toLowerCase() ?? ""] ?? Zap
  return { Icon, color: cat?.color ?? "#5E6AD2", name: cat?.name ?? "General" }
}

function ReviewContent() {
  const router = useRouter()
  const { selectedDate, setSelectedDate, updateBlock, blocks, activeBlockId, categories, habits, habitRecords } = useApp()
  const timerCtx = useTimerContext()

  const currentDate = selectedDate
  const dayBlocks = useBlocksByDate(currentDate)
  const dateObj = parseISO(currentDate)

  const stats = useMemo(() => {
    const now = new Date()
    const completed = dayBlocks.filter((b) => b.completed)
    const missed = dayBlocks.filter((b) => !b.completed && b.endTime < format(now, "HH:mm"))
    const savedTime = dayBlocks.reduce((sum, b) => {
      const sessions = b.focusSessions ?? []
      return sum + sessions.reduce((s, fs) => s + fs.durationMinutes, 0)
    }, 0)
    const activeMins = timerCtx.phase !== "idle" && activeBlockId !== null
      ? timerCtx.elapsed / 60
      : 0
    return { completed, missed, focusTime: savedTime + activeMins, total: dayBlocks.length }
  }, [dayBlocks, timerCtx.elapsed, timerCtx.phase, activeBlockId])

  const totalSessions = useMemo(() => {
    const saved = dayBlocks.reduce((sum, b) => sum + (b.focusSessions ?? []).length, 0)
    const hasActive = timerCtx.phase !== "idle" && activeBlockId !== null ? 1 : 0
    return saved + hasActive
  }, [dayBlocks, timerCtx.phase, activeBlockId])

  const focusProgress = useMemo(() => {
    const totalScheduled = dayBlocks.reduce((sum, b) => sum + calcDuration(b.startTime, b.endTime), 0)
    const pct = totalScheduled > 0 ? Math.min(100, Math.round((stats.focusTime / totalScheduled) * 100)) : 0
    return { totalScheduled, pct }
  }, [dayBlocks, stats.focusTime])

  const todayHabitRecords = useMemo(() => {
    return habitRecords.filter((r) => r.date === currentDate)
  }, [habitRecords, currentDate])

  const habitStats = useMemo(() => {
    const done = todayHabitRecords.filter((r) => r.status === "completed").length
    const failed = todayHabitRecords.filter((r) => r.status === "failed").length
    const pending = habits.length - done - failed
    const pct = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0
    let bestStreak = 0
    for (const h of habits) { const s = getStreak(h.id, habitRecords); if (s > bestStreak) bestStreak = s }
    return { done, failed, pending, total: habits.length, pct, bestStreak }
  }, [todayHabitRecords, habits, habitRecords])

  const notifiedDone = useRef<Set<string>>(new Set())
  const [showFocusDetail, setShowFocusDetail] = useState(false)

  const catMap = useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach((c) => { map[c.id] = c.color })
    return map
  }, [categories])

  useEffect(() => {
    for (const block of dayBlocks) {
      if (notifiedDone.current.has(block.id)) continue
      const scheduled = calcDuration(block.startTime, block.endTime)
      if (scheduled <= 0) continue
      const savedMins = (block.focusSessions ?? []).reduce((s, fs) => s + fs.durationMinutes, 0)
      const activeMins = timerCtx.phase !== "idle" && activeBlockId === block.id ? Math.round(timerCtx.elapsed / 60) : 0
      if (savedMins + activeMins >= scheduled) {
        notifiedDone.current.add(block.id)
        toast.success(`Waktu habis! ${block.title} selesai`)
      }
    }
  }, [dayBlocks, timerCtx.elapsed, timerCtx.phase, activeBlockId])

  const handleReschedule = useCallback(async (blockId: string) => {
    const tomorrow = addDays(parseISO(currentDate), 1)
    const block = blocks.find((b) => b.id === blockId)
    if (block) { block.date = formatDate(tomorrow); block.updatedAt = new Date().toISOString(); await updateBlock(block) }
  }, [currentDate, blocks, updateBlock])

  const handleRescheduleAll = useCallback(async () => {
    for (const block of stats.missed) await handleReschedule(block.id)
  }, [stats.missed, handleReschedule])

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const prevDay = useCallback(() => {
    const prev = addDays(dateObj, -1)
    setSelectedDate(formatDate(prev)); router.push(`/review?date=${formatDate(prev)}`)
  }, [dateObj, setSelectedDate, router])

  const nextDay = useCallback(() => {
    const next = addDays(dateObj, 1)
    setSelectedDate(formatDate(next)); router.push(`/review?date=${formatDate(next)}`)
  }, [dateObj, setSelectedDate, router])

  const isPerfect = stats.total > 0 && stats.missed.length === 0
  const isEmpty = dayBlocks.length === 0 && habits.length === 0

  // ─── BlockCard ──────────────────────────────────────────────
  function BlockCard({ block, variant }: { block: Block; variant: "completed" | "missed" }) {
    const scheduled = calcDuration(block.startTime, block.endTime)
    const savedMins = (block.focusSessions ?? []).reduce((s, fs) => s + fs.durationMinutes, 0)
    const activeMins = timerCtx.phase !== "idle" && activeBlockId === block.id ? Math.round(timerCtx.elapsed / 60) : 0
    const totalMins = savedMins + activeMins
    const progress = scheduled > 0 ? Math.min(100, Math.round((totalMins / scheduled) * 100)) : 0
    const sessionCount = (block.focusSessions ?? []).length + (activeMins > 0 ? 1 : 0)
    const { Icon, color, name } = getCategoryIcon(categories, block.categoryId)
    const isDone = variant === "completed"

    return (
      <div className="group relative">
        <div
          className="relative flex items-stretch gap-0 rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: isDone
              ? "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))"
              : "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))",
            border: `1px solid ${isDone ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)"}`,
            boxShadow: isDone
              ? "0 0 0 1px rgba(34,197,94,0.06), 0 2px 12px rgba(0,0,0,0.2)"
              : "0 0 0 1px rgba(245,158,11,0.06), 0 2px 12px rgba(0,0,0,0.2)",
          }}
        >
          {/* Accent bar */}
          <div className="w-1 shrink-0 transition-all duration-200 group-hover:w-1.5" style={{ background: isDone ? "#22C55E" : "#F59E0B" }} />

          {/* Category icon + time column */}
          <div className="flex flex-col items-center justify-center gap-1 px-3 py-3 shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110" style={{ background: isDone ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)" }}>
              {isDone ? <CheckCircle2 className="w-4 h-4" style={{ color: "#22C55E" }} /> : <Circle className="w-4 h-4" style={{ color: "#F59E0B" }} />}
            </div>
            <span className="font-mono text-[10px] font-medium" style={{ color: "#5A5E66" }}>{block.startTime}</span>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 py-3 pr-3">
            {/* Title */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-semibold truncate ${isDone ? "text-[#8A8F98] line-through" : "text-[#EDEDEF]"}`}>{block.title}</span>
              {!isDone && activeMins > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] text-[9px] font-semibold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] inline-block" /> LIVE
                </span>
              )}
            </div>

            {/* Pills row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "#8A8F98" }}>
                <Clock className="w-3 h-3" /> {formatDuration(block.startTime, block.endTime)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: `${color}15`, color }}>
                <Icon className="w-3 h-3" /> {name}
              </span>
              {sessionCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(94,106,210,0.12)", color: "#5E6AD2" }}>
                  <Timer className="w-3 h-3" /> {sessionCount} sesi
                </span>
              )}
            </div>

            {/* Progress bar */}
            {(totalMins > 0 || activeMins > 0) && (
              <div className="mt-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${progress}%`,
                        background: isDone ? "linear-gradient(90deg, #22C55E, #16A34A)" : progress >= 100 ? "linear-gradient(90deg, #F59E0B, #D97706)" : "linear-gradient(90deg, #5E6AD2, #818CF8)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium tabular-nums whitespace-nowrap" style={{ color: "#8A8F98" }}>{totalMins}m / {scheduled}m</span>
                </div>
                {activeMins > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse inline-block" />
                    <span className="text-[10px]" style={{ color: "#F59E0B" }}>
                      Focus aktif — {savedMins > 0 ? `${savedMins}m tersimpan + ` : ""}{activeMins}m sesi ini
                    </span>
                  </div>
                )}
              </div>
            )}

            {isDone && block.focusSessions && block.focusSessions.length === 0 && (
              <p className="text-[10px] mt-1" style={{ color: "#5A5E66" }}>Selesai tanpa sesi fokus</p>
            )}
          </div>

          {/* Action column */}
          {!isDone && (
            <div className="flex items-center pr-2">
              <button onClick={() => handleReschedule(block.id)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 hover:bg-[#F59E0B]/10 group/btn" style={{ color: "#F59E0B" }} title="Jadwalkan ulang ke besok">
                <span className="text-[10px] font-semibold hidden sm:inline">Jadwal Ulang</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pb-16 md:pb-0">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={prevDay} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#8A8F98] transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <div className="text-center">
                <h1 className="text-lg font-semibold text-[#EDEDEF]">Tinjauan Harian</h1>
                <p className="text-xs text-[#8A8F98] mt-0.5">{formatDisplayDate(dateObj)}</p>
              </div>
              <button onClick={nextDay} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#8A8F98] transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, rgba(94,106,210,0.12), rgba(94,106,210,0.04))", border: "1px solid rgba(94,106,210,0.1)" }}>
                <CalendarArrowUp className="w-8 h-8 text-[#5E6AD2]" />
              </div>
              <p className="text-[#EDEDEF] font-medium mb-1">Belum ada aktivitas hari ini</p>
              <p className="text-xs text-[#8A8F98] mb-6">Mulai rencanakan hari esok!</p>
              <Button variant="secondary" onClick={() => router.push("/today")}><Target className="w-4 h-4" /> Buat Blok Baru</Button>
            </div>
          </div>
        </main>
        <BottomTab />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button onClick={prevDay} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#8A8F98] transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-[#EDEDEF]">Tinjauan Harian</h1>
              <p className="text-xs text-[#8A8F98] mt-0.5">{formatDisplayDate(dateObj)}</p>
            </div>
            <button onClick={nextDay} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#8A8F98] transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>

          {/* Block Stats */}
          <section className="grid grid-cols-3 gap-3">
            {[
              { icon: CheckCircle2, value: stats.completed.length, label: "Selesai", sub: stats.total > 0 ? `${Math.round((stats.completed.length / stats.total) * 100)}% dari ${stats.total}` : "0%", color: "#22C55E", bg: "rgba(34,197,94,0.1)", target: "section-selesai" },
              { icon: Circle, value: stats.missed.length, label: "Terlewat", sub: stats.missed.length > 0 ? "Butuh reschedule" : "—", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", target: "section-terlewat" },
              { icon: Timer, value: stats.focusTime > 0 ? (stats.focusTime >= 60 ? `${Math.round(stats.focusTime / 60)}j` : `${Math.floor(stats.focusTime)}m`) : "0", label: "Fokus", sub: totalSessions > 0 ? `${totalSessions} sesi fokus` : "—", color: "#5E6AD2", bg: "rgba(94,106,210,0.1)", target: "section-habits" },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => scrollTo(s.target)}
                className="relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${s.bg}, transparent)`, border: `1px solid ${s.color}15`, boxShadow: `0 0 0 1px ${s.color}08` }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: `${s.color}08` }} />
                <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
                <p className="text-2xl font-bold text-[#EDEDEF] tabular-nums">{s.value}</p>
                <p className="text-[11px] font-medium text-[#8A8F98] mt-0.5">{s.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: s.color }}>{s.sub}</p>
              </button>
            ))}
          </section>

          {/* Focus Progress Card */}
          <div className="rounded-xl overflow-hidden transition-all duration-200" style={{ background: "linear-gradient(135deg, rgba(94,106,210,0.1), rgba(94,106,210,0.03))", border: "1px solid rgba(94,106,210,0.12)", boxShadow: "0 0 0 1px rgba(94,106,210,0.06)" }}>
            <button
              type="button"
              onClick={() => setShowFocusDetail(!showFocusDetail)}
              className="w-full p-4 text-left transition-all duration-200 hover:brightness-110 active:brightness-90 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-[#5E6AD2]" />
                  <span className="text-sm font-semibold text-[#EDEDEF]">Progress Fokus</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#5E6AD2] tabular-nums">{focusProgress.pct}%</span>
                  <svg className={`w-4 h-4 text-[#8A8F98] transition-transform duration-200 ${showFocusDetail ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${focusProgress.pct}%`,
                    background: focusProgress.pct >= 100 ? "linear-gradient(90deg, #22C55E, #16A34A)" : "linear-gradient(90deg, #5E6AD2, #818CF8)",
                  }}
                />
              </div>
              <p className="text-xs text-[#8A8F98] mt-1.5">
                {Math.floor(stats.focusTime)}m / {focusProgress.totalScheduled}m dari jadwal
                {timerCtx.phase !== "idle" && activeBlockId !== null && (
                  <span className="inline-flex items-center gap-1 ml-2 text-[#F59E0B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse inline-block" />
                    Live
                  </span>
                )}
              </p>
            </button>

            {showFocusDetail && (
              <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 space-y-2">
                {timerCtx.phase !== "idle" && activeBlockId && (() => {
                  const activeBlock = dayBlocks.find((b) => b.id === activeBlockId)
                  if (!activeBlock) return null
                  const color = activeBlock.color ?? catMap[activeBlock.categoryId] ?? "#6B7280"
                  const scheduled = calcDuration(activeBlock.startTime, activeBlock.endTime)
                  const savedMins = activeBlock.focusSessions.reduce((s, fs) => s + fs.durationMinutes, 0)
                  const currentMins = timerCtx.elapsed / 60
                  const totalMins = savedMins + currentMins
                  const pct = Math.min(100, Math.round((totalMins / scheduled) * 100))
                  return (
                    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
                      <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(245,158,11,0.08)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse inline-block shrink-0" />
                        <span className="text-[11px] font-semibold text-[#F59E0B]">Sedang Berjalan</span>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-sm font-medium text-[#EDEDEF] truncate">{activeBlock.title}</span>
                        </div>
                        <p className="text-[11px] text-[#8A8F98] mb-1.5">{activeBlock.startTime} — {activeBlock.endTime}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #F59E0B, #D97706)" }} />
                          </div>
                          <span className="text-[10px] font-medium tabular-nums text-[#F59E0B]">{Math.floor(totalMins)}m / {scheduled}m</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {stats.completed.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#22C55E] mb-1.5">Selesai ({stats.completed.length})</p>
                    <div className="space-y-1">
                      {stats.completed.slice(0, 5).map((b) => {
                        const color = b.color ?? catMap[b.categoryId] ?? "#6B7280"
                        const scheduled = calcDuration(b.startTime, b.endTime)
                        const focusMins = b.focusSessions.reduce((s, fs) => s + fs.durationMinutes, 0)
                        const pct = Math.min(100, Math.round((focusMins / scheduled) * 100))
                        return (
                          <div key={b.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                            <span className="text-xs text-[#8A8F98] flex-1 truncate">{b.title}</span>
                            <span className="text-[10px] font-medium text-[#22C55E]">{focusMins}m</span>
                            <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#22C55E" }} />
                            </div>
                          </div>
                        )
                      })}
                      {stats.completed.length > 5 && <p className="text-[10px] text-[#5A5E66] text-center">+{stats.completed.length - 5} lainnya</p>}
                    </div>
                  </div>
                )}

                {stats.missed.filter((b) => b.id !== activeBlockId).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#F59E0B] mb-1.5">Terlewat ({stats.missed.filter((b) => b.id !== activeBlockId).length})</p>
                    <div className="space-y-1">
                      {stats.missed.filter((b) => b.id !== activeBlockId).slice(0, 5).map((b) => {
                        const color = b.color ?? catMap[b.categoryId] ?? "#6B7280"
                        const focusMins = b.focusSessions.reduce((s, fs) => s + fs.durationMinutes, 0)
                        return (
                          <div key={b.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                            <span className="text-xs text-[#8A8F98] flex-1 truncate">{b.title}</span>
                            {focusMins > 0 && <span className="text-[10px] text-[#5A5E66]">{focusMins}m</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {dayBlocks.filter((b) => !b.completed && !(timerCtx.phase !== "idle" && b.id === activeBlockId) && !(b.endTime < format(new Date(), "HH:mm"))).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#5E6AD2] mb-1.5">Tersisa</p>
                    <div className="space-y-1">
                      {dayBlocks.filter((b) => !b.completed && !(timerCtx.phase !== "idle" && b.id === activeBlockId) && !(b.endTime < format(new Date(), "HH:mm"))).map((b) => {
                        const color = b.color ?? catMap[b.categoryId] ?? "#6B7280"
                        return (
                          <div key={b.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                            <span className="text-xs text-[#8A8F98] flex-1 truncate">{b.title}</span>
                            <span className="text-[10px] text-[#5A5E66]">{b.startTime}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Habit Stats Row */}
          {habits.length > 0 && (
            <section className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => scrollTo("section-habits")}
                className="relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ background: "linear-gradient(135deg, rgba(94,106,210,0.1), transparent)", border: "1px solid rgba(94,106,210,0.12)", boxShadow: "0 0 0 1px rgba(94,106,210,0.06)" }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-[#5E6AD2]/5 -translate-y-1/2 translate-x-1/2" />
                <ListChecks className="w-5 h-5 text-[#5E6AD2] mb-2" />
                <p className="text-2xl font-bold text-[#EDEDEF] tabular-nums">{habitStats.pct}%</p>
                <p className="text-[11px] font-medium text-[#8A8F98] mt-0.5">Habit</p>
                <p className="text-[10px] text-[#5A5E66] mt-0.5">{habitStats.done}/{habitStats.total} selesai</p>
              </button>
              <button
                type="button"
                onClick={() => scrollTo("section-habits")}
                className="relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.1), transparent)", border: "1px solid rgba(245,158,11,0.12)", boxShadow: "0 0 0 1px rgba(245,158,11,0.06)" }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-[#F59E0B]/5 -translate-y-1/2 translate-x-1/2" />
                <Flame className="w-5 h-5 text-[#F59E0B] mb-2" />
                <p className="text-2xl font-bold text-[#EDEDEF] tabular-nums">{habitStats.bestStreak}</p>
                <p className="text-[11px] font-medium text-[#8A8F98] mt-0.5">Streak</p>
                <p className="text-[10px] text-[#5A5E66] mt-0.5">hari berturut-turut</p>
              </button>
              <button
                type="button"
                onClick={() => scrollTo("section-habits")}
                className="relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.1), transparent)", border: "1px solid rgba(244,63,94,0.12)", boxShadow: "0 0 0 1px rgba(244,63,94,0.06)" }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-[#F43F5E]/5 -translate-y-1/2 translate-x-1/2" />
                <X className="w-5 h-5 text-[#F43F5E] mb-2" />
                <p className="text-2xl font-bold text-[#EDEDEF] tabular-nums">{habitStats.failed}</p>
                <p className="text-[11px] font-medium text-[#8A8F98] mt-0.5">Gagal</p>
                <p className="text-[10px] text-[#5A5E66] mt-0.5">{habitStats.pending} tersisa</p>
              </button>
            </section>
          )}

          {/* Perfect Day Banner */}
          {isPerfect && (
            <div className="relative overflow-hidden rounded-xl p-5 text-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03))", border: "1px solid rgba(34,197,94,0.15)", boxShadow: "0 0 30px rgba(34,197,94,0.05), 0 0 0 1px rgba(34,197,94,0.06)" }}>
              <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-32 h-32 text-[#22C55E]/5" /></div>
              <div className="relative">
                <Sparkles className="w-6 h-6 text-[#22C55E] mx-auto mb-2" />
                <p className="text-lg font-bold text-[#22C55E]">Hari yang Sempurna! 🎉</p>
                <p className="text-sm text-[#8A8F98] mt-1">Semua blok terselesaikan — kerja bagus!</p>
              </div>
            </div>
          )}

          {/* Completed blocks */}
          {stats.completed.length > 0 && (
            <section id="section-selesai">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-[#8A8F98]">Selesai</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#22C55E]" style={{ background: "rgba(34,197,94,0.12)" }}>{stats.completed.length} ITEM</span>
              </div>
              <div className="space-y-2">{stats.completed.map((b) => <BlockCard key={b.id} block={b} variant="completed" />)}</div>
            </section>
          )}

          {/* Missed blocks */}
          {stats.missed.length > 0 && (
            <section id="section-terlewat">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-[#8A8F98]">Terlewat</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#F59E0B]" style={{ background: "rgba(245,158,11,0.12)" }}>{stats.missed.length} ITEM</span>
              </div>
              <div className="space-y-2">{stats.missed.map((b) => <BlockCard key={b.id} block={b} variant="missed" />)}</div>
              <Button variant="secondary" className="w-full mt-4 group" onClick={handleRescheduleAll}>
                <CalendarArrowUp className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                Jadwalkan Ulang Semua ke Besok
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </section>
          )}

          {/* Habit Progress Cards */}
          {habits.length > 0 && (
            <section id="section-habits">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-[#8A8F98]">Progress Habit</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#5E6AD2]" style={{ background: "rgba(94,106,210,0.12)" }}>{habitStats.done}/{habitStats.total}</span>
              </div>
              <div className="space-y-2">
                {habits.map((habit) => {
                  const record = todayHabitRecords.find((r) => r.habitId === habit.id)
                  const done = record?.status === "completed"
                  const failed = record?.status === "failed"
                  const pending = !done && !failed
                  const streak = getStreak(habit.id, habitRecords)

                  const weekDays: Date[] = []
                  for (let i = 6; i >= 0; i--) weekDays.push(subDays(new Date(), i))

                  return (
                    <div key={habit.id} className="group relative">
                      <div className="relative flex items-stretch gap-0 rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]" style={{
                        background: done ? "linear-gradient(135deg, rgba(94,106,210,0.1), rgba(94,106,210,0.03))" : failed ? "linear-gradient(135deg, rgba(244,63,94,0.1), rgba(244,63,94,0.03))" : "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                        border: `1px solid ${done ? "rgba(94,106,210,0.2)" : failed ? "rgba(244,63,94,0.2)" : "rgba(255,255,255,0.06)"}`,
                        boxShadow: done ? "0 0 0 1px rgba(94,106,210,0.06), 0 2px 12px rgba(0,0,0,0.2)" : failed ? "0 0 0 1px rgba(244,63,94,0.06), 0 2px 12px rgba(0,0,0,0.2)" : "0 0 0 1px rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.2)",
                      }}>
                        {/* Accent bar */}
                        <div className="w-1 shrink-0 transition-all duration-200 group-hover:w-1.5" style={{ background: done ? "#5E6AD2" : failed ? "#F43F5E" : habit.color }} />

                        {/* Status icon column */}
                        <div className="flex flex-col items-center justify-center gap-1 px-3 py-3 shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${done ? "bg-[#5E6AD2]/15 shadow-[0_0_8px_rgba(94,106,210,0.2)]" : failed ? "bg-[#F43F5E]/15 shadow-[0_0_8px_rgba(244,63,94,0.2)]" : "bg-white/[0.06] border-2 border-white/20"}`}>
                            {done && <svg className="w-4 h-4 text-[#5E6AD2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            {failed && <svg className="w-4 h-4 text-[#F43F5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg>}
                            {pending && <div className="w-2 h-2 rounded-full bg-white/40" />}
                          </div>
                          <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "#5A5E66" }}>{done ? "Selesai" : failed ? "Gagal" : "Pending"}</span>
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0 py-3 pr-3">
                          {/* Name + frequency */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-sm font-semibold truncate ${done || failed ? "text-[#8A8F98] line-through" : "text-[#EDEDEF]"}`}>{habit.name}</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase" style={{ background: "rgba(94,106,210,0.1)", color: "#5E6AD2" }}>{habit.frequency === "daily" ? "Harian" : "Mingguan"}</span>
                          </div>

                          {/* Pills row */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: streak > 0 ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.05)", color: streak > 0 ? "#F59E0B" : "#5A5E66" }}>
                              <Flame className={`w-3 h-3 ${streak > 0 ? "" : "opacity-50"}`} /> {streak > 0 ? `Streak ${streak} hari` : "Belum ada streak"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: `${habit.color}15`, color: habit.color }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: habit.color }} /> {habit.frequency === "daily" ? "Setiap hari" : "Setiap minggu"}
                            </span>
                          </div>

                          {/* Failure reason */}
                          {failed && record?.failureReason && (
                            <div className="px-3 py-2 rounded-lg mb-2" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.12)" }}>
                              <div className="flex items-start gap-1.5"><X className="w-3 h-3 text-[#F43F5E] mt-0.5 shrink-0" /><p className="text-[11px] text-[#F43F5E]/80 leading-relaxed">{record.failureReason}</p></div>
                            </div>
                          )}

                          {/* Mini 7-day grid */}
                          <div className="flex items-center gap-1.5">
                            {weekDays.map((day) => {
                              const dayStr = formatDate(day)
                              const dayRecord = habitRecords.find((r) => r.habitId === habit.id && r.date === dayStr)
                              const isTodayDay = dayStr === formatDate(new Date())
                              const dayDone = dayRecord?.status === "completed"
                              const dayFailed = dayRecord?.status === "failed"
                              const dayName = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][day.getDay()]
                              return (
                                <div key={dayStr} className="flex flex-col items-center gap-0.5">
                                  <span className="text-[8px] font-medium" style={{ color: isTodayDay ? "#5E6AD2" : "#5A5E66" }}>{dayName}</span>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${dayDone ? "bg-[#5E6AD2] shadow-[0_0_6px_rgba(94,106,210,0.3)]" : dayFailed ? "bg-[#F43F5E] shadow-[0_0_6px_rgba(244,63,94,0.3)]" : "bg-white/[0.05] border border-white/[0.08]"}`}>
                                    {dayDone && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                    {dayFailed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Motivational Footer */}
          <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm font-medium text-[#8A8F98]">
              {stats.completed.length >= 4 ? "🌟 Fokus luar biasa hari ini!" : stats.completed.length >= 2 ? "💪 Kemajuan yang bagus!" : stats.completed.length >= 1 ? "🚀 Ada progres, lanjutkan!" : habitStats.done > 0 ? "💪 Habit harian berhasil!" : "🌱 Besok adalah kesempatan baru"}
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-[#5A5E66]">
              <Brain className="w-4 h-4" /><div className="h-px w-12 bg-white/[0.06]" /><Dumbbell className="w-4 h-4" /><div className="h-px w-12 bg-white/[0.06]" /><BookOpen className="w-4 h-4" />
            </div>
          </div>
        </div>
      </main>
      <BottomTab />
    </div>
  )
}

export default function ReviewPage() {
  return (
    <AuthGuard>
      <ReviewContent />
    </AuthGuard>
  )
}
