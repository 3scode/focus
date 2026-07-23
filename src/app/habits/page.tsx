"use client"

import { useMemo, useCallback, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Plus, Trash2, Flame } from "lucide-react"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"
import { formatDate, formatDisplayDate } from "@/lib/time"
import { subDays, isSameDay, startOfDay } from "date-fns"

function getStreak(habitId: string, records: { habitId: string; date: string }[]): number {
  const today = startOfDay(new Date())
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const day = subDays(today, i)
    const dayStr = formatDate(day)
    if (records.some((r) => r.habitId === habitId && r.date === dayStr)) {
      streak++
    } else if (i > 0) {
      break
    } else {
      return 0
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

function CompletionBarChart({ habitRecords, habits: habitsList, days }: {
  habitRecords: { habitId: string; date: string }[]
  habits: { id: string }[]
  days: Date[]
}) {
  const barMax = habitsList.length || 1
  const count = days.length
  const barWidth = Math.max(12, Math.min(36, 520 / count - 4))
  const chartHeight = 140
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="flex items-end justify-between px-2" style={{ minHeight: chartHeight + 40 }}>
      {days.map((day) => {
        const dayStr = formatDate(day)
        const count = habitRecords.filter((r) => r.date === dayStr).length
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
              {dayNames[day.getDay()].slice(0, 2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function HabitsContent() {
  const { habits, habitRecords, addHabit, addHabitRecord, deleteHabitRecord, deleteHabit } = useApp()
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
    const existing = todayRecords.find((r) => r.habitId === habitId)
    if (existing) {
      await deleteHabitRecord(existing.id)
    } else {
      await addHabitRecord({
        id: uuidv4(),
        habitId,
        date: today,
        completedAt: new Date().toISOString(),
      })
    }
  }, [todayRecords, today, addHabitRecord, deleteHabitRecord])

  const todayDone = todayRecords.length
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
      total += habitRecords.filter((r) => r.date === formatDate(day)).length
    }
    const possible = habits.length * range
    return possible > 0 ? Math.round((total / possible) * 100) : 0
  }, [habitRecords, days, habits, range])

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
                  { label: "Today", value: `${todayPct}%`, sub: `${todayDone}/${todayTotal} done` },
                  { label: "Best Streak", value: `${bestStreak}`, sub: "consecutive days", icon: true },
                  { label: `${range}D Avg`, value: `${periodAvg}%`, sub: "completion rate" },
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
                  <h2 className="text-sm font-semibold text-[#8A8F98]">Completion</h2>
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
              <h2 className="text-sm font-semibold text-[#8A8F98]">Today</h2>
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
                Add Habit
              </button>
            </div>
            <div className="space-y-2">
              {habits.map((habit) => {
                const done = todayRecords.some((r) => r.habitId === habit.id)
                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: done
                        ? "linear-gradient(to bottom, rgba(94,106,210,0.12), rgba(94,106,210,0.04))"
                        : "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                      border: done
                        ? "1px solid rgba(94,106,210,0.25)"
                        : "1px solid rgba(255,255,255,0.06)",
                      boxShadow: done ? "0 0 20px rgba(94,106,210,0.08)" : "0 0 0 1px rgba(255,255,255,0.06)",
                    }}
                    onClick={() => handleToggle(habit.id)}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        done
                          ? "bg-[#5E6AD2] border-[#5E6AD2] shadow-[0_0_12px_rgba(94,106,210,0.4)]"
                          : "border-white/[0.2] hover:border-[#5E6AD2]"
                      }`}
                    >
                      {done && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm block ${done ? "text-white/50 line-through" : "text-[#EDEDEF]"}`}>
                        {habit.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[#8A8F98]">
                        <Flame className="w-3.5 h-3.5" style={{ color: habit.color }} />
                        <span className="text-xs font-medium">{getStreak(habit.id, habitRecords)}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteHabit(habit.id)
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#8A8F98] hover:text-[#EF4444] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
              {habits.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-[#8A8F98]">No habits yet.</p>
                  <p className="text-xs text-[#5A5E66] mt-1">Click &quot;Add Habit&quot; to start tracking.</p>
                </div>
              )}
            </div>
          </section>

          {habits.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[#8A8F98] mb-3">Past {range} Days</h2>
              <div className="overflow-x-auto">
                <div className="min-w-[400px] space-y-1">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-28 shrink-0" />
                    {days.map((day) => {
                      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                      const isTodayDay = isSameDay(day, new Date())
                      return (
                        <div
                          key={day.toISOString()}
                          className={`flex-1 text-center text-[10px] font-medium ${
                            isTodayDay ? "text-[#5E6AD2]" : "text-[#5A5E66]"
                          }`}
                        >
                          <div>{dayNames[day.getDay()]}</div>
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
                      <div className="w-28 shrink-0 flex items-center gap-2">
                        <span className="text-xs text-[#8A8F98] truncate">{habit.name}</span>
                      </div>
                      {days.map((day) => {
                        const dayStr = formatDate(day)
                        const done = habitRecords.some(
                          (r) => r.habitId === habit.id && r.date === dayStr
                        )
                        return (
                          <div key={dayStr} className="flex-1 flex justify-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                done
                                  ? "bg-[#5E6AD2] shadow-[0_0_8px_rgba(94,106,210,0.3)]"
                                  : "bg-white/[0.04] border border-white/[0.06]"
                              }`}
                            >
                              {done && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
