"use client"

import { useMemo, useCallback, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Plus, Trash2, Flame, X, Check } from "lucide-react"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { useApp } from "@/store"
import { formatDate, formatDisplayDate } from "@/lib/time"
import { subDays } from "date-fns/subDays"
import { isSameDay } from "date-fns/isSameDay"
import { startOfDay } from "date-fns/startOfDay"
import { parseISO } from "date-fns/parseISO"
import { format } from "date-fns/format"

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

function getStreak(habitId: string, records: { habitId: string; date: string; status?: string }[]): number {
  const today = startOfDay(new Date())
  let streak = 0
  const todayStr = formatDate(today)
  const ok = (r: { habitId: string; date: string; status?: string }) => (r.status ?? "completed") !== "failed"
  const hasToday = records.some((r) => r.habitId === habitId && r.date === todayStr && ok(r))

  for (let i = hasToday ? 0 : 1; i < 365; i++) {
    const day = subDays(today, i)
    const dayStr = formatDate(day)
    if (records.some((r) => r.habitId === habitId && r.date === dayStr && ok(r))) {
      streak++
    } else {
      break
    }
  }
  return streak
}

const SWATCHES = ["#5E6AD2", "#10B981", "#F43F5E", "#8B5CF6", "#F59E0B", "#22C55E", "#14B8A6", "#EC4899"]

type Range = 7 | 14 | 30

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: "7D", value: 7 },
  { label: "14D", value: 14 },
  { label: "1M", value: 30 },
]

function CompletionBarChart({ habitRecords: records, habits: habitsList, days }: {
  habitRecords: { habitId: string; date: string; status?: string }[]
  habits: { id: string }[]
  days: Date[]
}) {
  const habitRecords = records.map((r) => ({ ...r, status: r.status ?? "completed" }))
  const barMax = habitsList.length || 1
  const count = days.length
  const barWidth = Math.max(12, Math.min(36, 520 / count - 4))
  const chartHeight = 140
  const dayNamesLocal = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="flex items-end justify-between px-2" style={{ minHeight: chartHeight + 40 }}>
      {days.map((day) => {
        const dayStr = formatDate(day)
        const count = habitRecords.filter((r) => r.date === dayStr && r.status !== "failed").length
        const pct = count / barMax
        const barHeight = Math.max(pct * (chartHeight - 10), count > 0 ? 4 : 2)
        const isTodayDay = isSameDay(day, new Date())
        return (
          <div key={dayStr} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium text-[#5A5E66]">{count}/{barMax}</span>
            <svg width={barWidth} height={chartHeight} className="overflow-visible">
              <rect
                x={0}
                y={chartHeight - barHeight}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={isTodayDay ? "#5E6AD2" : "rgba(255,255,255,0.1)"}
                className="transition-all duration-500"
                style={{
                  filter: isTodayDay ? "drop-shadow(0 0 8px rgba(94,106,210,0.4))" : "none",
                }}
              />
              {isTodayDay && (
                <rect
                  x={0}
                  y={chartHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill="url(#barGradient)"
                />
              )}
            </svg>
            <span className={`text-[10px] font-medium ${isTodayDay ? "text-[#5E6AD2]" : "text-[#5A5E66]"}`}>
              {dayNamesLocal[day.getDay()].slice(0, 2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function HabitsContent() {
  const { habits, habitRecords, addHabit, addHabitRecord, deleteHabitRecord, deleteHabit, updateHabit } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [failReasonText, setFailReasonText] = useState("")
  const [showFailModal, setShowFailModal] = useState(false)
  const [failModalHabitId, setFailModalHabitId] = useState<string | null>(null)
  const today = formatDate(new Date())
  const todayRecords = useMemo(() => habitRecords.filter((r) => r.date === today), [habitRecords, today])
  const [range, setRange] = useState<Range>(7)

  const days = useMemo(() => {
    const result: Date[] = []
    for (let i = range - 1; i >= 0; i--) {
      result.push(subDays(new Date(), i))
    }
    return result
  }, [range])

  const handleToggle = useCallback(async (habitId: string) => {
    const existing = todayRecords.find((r) => r.habitId === habitId && (r.status ?? "completed") !== "failed")
    if (existing) {
      await deleteHabitRecord(existing.id)
    } else {
      const failed = todayRecords.find((r) => r.habitId === habitId && r.status === "failed")
      if (failed) await deleteHabitRecord(failed.id)
      await addHabitRecord({
        id: uuidv4(),
        habitId,
        date: today,
        completedAt: new Date().toISOString(),
        status: "completed",
      })
    }
  }, [todayRecords, today, addHabitRecord, deleteHabitRecord])

  const handleFail = useCallback(async (habitId: string, reason: string) => {
    const existing = todayRecords.find((r) => r.habitId === habitId)
    if (existing) await deleteHabitRecord(existing.id)
    await addHabitRecord({
      id: uuidv4(),
      habitId,
      date: today,
      completedAt: new Date().toISOString(),
      status: "failed",
      failureReason: reason || undefined,
    })
    setFailModalHabitId(null)
    setFailReasonText("")
  }, [todayRecords, today, addHabitRecord, deleteHabitRecord])

  const todayDone = todayRecords.filter((r) => (r.status ?? "completed") !== "failed").length
  const todayTotal = habits.length
  const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0

  const bestStreak = useMemo(() => {
    let best = 0
    for (const h of habits) {
      const s = getStreak(h.id, habitRecords)
      if (s > best) best = s
    }
    return best
  }, [habits, habitRecords])

  const periodAvg = useMemo(() => {
    let total = 0
    for (const day of days) {
      total += habitRecords.filter((r) => r.date === formatDate(day) && (r.status ?? "completed") !== "failed").length
    }
    const possible = habits.reduce((sum, h) => {
      return sum + (h.frequency === "weekly" ? Math.ceil(range / 7) : range)
    }, 0)
    return possible > 0 ? Math.round((total / possible) * 100) : 0
  }, [habitRecords, days, habits, range])

  const failureHistoryRecords = habitRecords
    .filter((r) => r.status === "failed" && days.some((d) => formatDate(d) === r.date))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
          <div>
            <h1 className="text-lg font-semibold text-[#EDEDEF]">Habits</h1>
            <p className="text-sm text-[#8A8F98] mt-1">{formatDisplayDate(new Date())}</p>
          </div>

          {habits.length > 0 && (
            <>
              <section className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Hari Ini", value: `${todayPct}%`, sub: `${todayDone}/${todayTotal} selesai` },
                    { label: "Streak Terbaik", value: `${bestStreak}`, sub: "hari berturut-turut", icon: true },
                    { label: `${range}H Rata-rata`, value: `${periodAvg}%`, sub: "tingkat penyelesaian" },
                  ].map((stat) => (
                  <div
                    key={stat.label}
                    className="px-4 py-3 rounded-xl"
                    style={{
                      background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                    }}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-[#5A5E66] font-semibold">{stat.label}</p>
                    <p className="text-xl font-semibold text-[#EDEDEF] mt-1">{stat.value}</p>
                    <p className="text-[10px] text-[#8A8F98] mt-0.5">{stat.sub}</p>
                  </div>
                ))}
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[#8A8F98]">Penyelesaian</h2>
                  <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5">
                    {RANGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRange(opt.value)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                          range === opt.value
                            ? "bg-[#5E6AD2] text-white shadow-[0_0_12px_rgba(94,106,210,0.3)]"
                            : "text-[#8A8F98] hover:text-[#EDEDEF]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className="px-4 py-5 rounded-xl"
                  style={{
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                >
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#5E6AD2" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#5E6AD2" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <CompletionBarChart habitRecords={habitRecords} habits={habits} days={days} />
                </div>
              </section>
            </>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#8A8F98]">Hari Ini</h2>
              <button
                onClick={() => {
                  addHabit({
                    id: uuidv4(),
                    name: "New Habit",
                    color: SWATCHES[Math.floor(Math.random() * SWATCHES.length)],
                    frequency: "daily",
                    order: habits.length,
                    createdAt: new Date().toISOString(),
                  })
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#EDEDEF] transition-all hover:bg-white/[0.05]"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Habit
              </button>
            </div>
            <div className="space-y-2">
              {habits.map((habit) => {
                const record = todayRecords.find((r) => r.habitId === habit.id)
                const done = record?.status === "completed"
                const failed = record?.status === "failed"
                return (
                  <div key={habit.id}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: done
                          ? "linear-gradient(to bottom, rgba(94,106,210,0.12), rgba(94,106,210,0.04))"
                          : failed
                          ? "linear-gradient(to bottom, rgba(244,63,94,0.12), rgba(244,63,94,0.04))"
                          : "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                        border: done
                          ? "1px solid rgba(94,106,210,0.25)"
                          : failed
                          ? "1px solid rgba(244,63,94,0.25)"
                          : "1px solid rgba(255,255,255,0.06)",
                        boxShadow: done
                          ? "0 0 20px rgba(94,106,210,0.08)"
                          : failed
                          ? "0 0 20px rgba(244,63,94,0.08)"
                          : "0 0 0 1px rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          done
                            ? "bg-[#5E6AD2] border-[#5E6AD2] shadow-[0_0_12px_rgba(94,106,210,0.4)]"
                            : failed
                            ? "bg-[#F43F5E] border-[#F43F5E] shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                            : "border-white/40 hover:border-[#5E6AD2] hover:bg-white/[0.06]"
                        }`}
                        onClick={(e) => { e.stopPropagation(); handleToggle(habit.id) }}
                      >
                        {done && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {failed && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); setEditingId(habit.id); setEditValue(habit.name) }}>
                        {editingId === habit.id ? (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              if (editValue.trim() && editValue !== habit.name) {
                                updateHabit(habit.id, { name: editValue.trim() })
                              }
                              setEditingId(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                              if (e.key === "Escape") setEditingId(null)
                            }}
                            className="text-sm bg-transparent text-[#EDEDEF] border-b border-[#5E6AD2] outline-none w-full"
                          />
                        ) : (
                          <div className="space-y-1">
                            <span className={`text-sm block ${done ? "text-white/50 line-through" : failed ? "text-[#F43F5E] line-through" : "text-[#EDEDEF]"}`}>
                              {habit.name}
                            </span>
                            {failed && record?.failureReason && (
                              <div className="px-3 py-2 rounded-lg bg-[#F43F5E]/8 border border-[#F43F5E]/15">
                                <p className="text-xs text-[#F43F5E]/80 leading-relaxed">{record.failureReason}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (!done) handleToggle(habit.id)
                          }}
                          className={`p-2.5 rounded-xl transition-all ${
                            done 
                              ? "text-white bg-[#5E6AD2] shadow-[0_0_12px_rgba(94,106,210,0.4)]" 
                              : "text-[#8A8F98] hover:bg-white/[0.08] hover:text-[#5E6AD2] border border-white/20"
                          }`}
                          title={done ? "Tandai belum selesai" : "Tandai selesai"}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const isFailed = todayRecords.some((r) => r.habitId === habit.id && r.status === "failed")
                            if (isFailed) {
                              handleToggle(habit.id)
                            } else {
                              setFailModalHabitId(habit.id); 
                              setFailReasonText(""); 
                              setShowFailModal(true) 
                            }
                          }}
                          className={`p-2.5 rounded-xl transition-all ${
                            failed 
                              ? "text-white bg-[#F43F5E] shadow-[0_0_12px_rgba(244,63,94,0.4)]" 
                              : "text-[#8A8F98] hover:bg-white/[0.08] hover:text-[#F43F5E] border border-white/20"
                          }`}
                          title="Tandai gagal (opsional)"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <Flame className="w-4 h-4" style={{ color: habit.color }} />
                          <span className="text-xs font-medium text-[#8A8F98]">{getStreak(habit.id, habitRecords)}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteHabit(habit.id)
                          }}
                          className="p-2.5 rounded-xl hover:bg-white/[0.08] text-[#8A8F98] hover:text-[#EF4444] transition-colors border border-transparent hover:border-white/10"
                          title="Delete habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <Modal 
                      open={showFailModal && failModalHabitId !== null} 
                      title="Tandai Habit sebagai Gagal"
                      onClose={() => setShowFailModal(false)}
                    >
                      <div className="space-y-4">
                        <p className="text-sm text-[#8A8F98]">Apa yang menghalangi kamu menyelesaikan habit ini hari ini? <span className="text-[#5A5E66]">(opsional)</span></p>
                        <textarea
                          autoFocus
                          value={failReasonText}
                          onChange={(e) => setFailReasonText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              if (failModalHabitId) handleFail(failModalHabitId, failReasonText)
                              setShowFailModal(false)
                            }
                            if (e.key === "Escape") {
                              setShowFailModal(false)
                              setFailReasonText("")
                            }
                          }}
                          placeholder="Tulis alasan gagal..."
                          className="w-full px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.05] text-[#EDEDEF] placeholder:text-[#5A5E66] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/30 focus:border-[#5E6AD2]/30 text-base transition-all resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="secondary" onClick={() => { setShowFailModal(false); setFailReasonText("") }}>
                            Batal
                          </Button>
                          <Button 
                            variant="secondary"
                            onClick={() => { if (failModalHabitId) handleFail(failModalHabitId, ""); setShowFailModal(false) }}
                          >
                            Lewati
                          </Button>
                          <Button 
                            onClick={() => { if (failModalHabitId) handleFail(failModalHabitId, failReasonText); setShowFailModal(false) }}
                            style={{ background: "#EF4444" }}
                          >
                            Tandai Gagal
                          </Button>
                        </div>
                      </div>
                    </Modal>
                  </div>
                )
              })}
              {habits.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-[#8A8F98]">Belum ada habit.</p>
                  <p className="text-xs text-[#5A5E66] mt-1">Klik &quot;Tambah Habit&quot; untuk mulai melacak.</p>
                </div>
              )}
            </div>
          </section>

          {habits.length > 0 && (
            <>
            <section>
                  <h2 className="text-sm font-semibold text-[#8A8F98] mb-3">7 Hari Terakhir</h2>
              <div className="overflow-x-auto">
                <div className="min-w-[400px] space-y-1">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-36 shrink-0" />
                     {days.map((day) => {
                       const isTodayDay = isSameDay(day, new Date())
                      return (
                        <div
                          key={day.toISOString()}
                          className={`flex-1 text-center text-[10px] font-medium ${
                            isTodayDay ? "text-[#5E6AD2]" : "text-[#5A5E66]"
                          }`}
                        >
                          <div>{DAY_NAMES[day.getDay()]}</div>
                          <div className="mt-0.5">{day.getDate()}</div>
                        </div>
                      )
                    })}
                  </div>
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
                      style={{
                        background: "linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="w-36 shrink-0 flex items-center gap-2">
                        <span className="text-xs text-[#8A8F98]">{habit.name}</span>
                      </div>
                      {days.map((day) => {
                        const dayStr = formatDate(day)
                        const record = habitRecords.find(
                          (r) => r.habitId === habit.id && r.date === dayStr
                        )
                        const done = record?.status === "completed"
                        const failed = record?.status === "failed"
                        return (
                          <div key={dayStr} className="flex-1 flex justify-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                done
                                  ? "bg-[#5E6AD2] shadow-[0_0_8px_rgba(94,106,210,0.3)]"
                                  : failed
                                  ? "bg-[#F43F5E] shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                                  : "bg-white/[0.04] border border-white/[0.06]"
                              }`}
                            >
                              {done && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {failed && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </section>
            
            {failureHistoryRecords.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-[#8A8F98] mb-3">Riwayat Kegagalan</h2>
                <div className="space-y-2">
                  {failureHistoryRecords.map((record) => {
                    const habit = habits.find((h) => h.id === record.habitId)
                    if (!habit) return null
                    const dateObj = parseISO(record.date)
                    const dateLabel = format(dateObj, "dd MMM yyyy")
                    const dayLabel = DAY_NAMES[dateObj.getDay()]
                    
                    return (
                      <div
                        key={record.id}
                        className="px-4 py-3 rounded-xl"
                        style={{
                          background: "linear-gradient(to bottom, rgba(244,63,94,0.08), rgba(244,63,94,0.02))",
                          border: "1px solid rgba(244,63,94,0.15)",
                          boxShadow: "0 0 0 1px rgba(244,63,94,0.08)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                            <span className="text-sm font-medium text-[#EDEDEF]">{habit.name}</span>
                          </div>
                          <span className="text-xs text-[#8A8F98]">{dayLabel}, {dateLabel}</span>
                        </div>
                        {record.failureReason && (
                          <p className="text-xs text-[#F43F5E]/80 leading-relaxed pl-4">{record.failureReason}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
            </>
          )}
        </div>
      </main>
      <BottomTab />
    </div>
  )
}

export default function HabitsPage() {
  return (
    <AuthGuard>
      <HabitsContent />
    </AuthGuard>
  )
}
