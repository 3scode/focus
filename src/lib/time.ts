export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function formatDisplayDate(date: Date): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
}

export function format(date: Date, pattern: string): string {
  const daysShort = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  const monthsShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
  const p = (n: number) => String(n).padStart(2, "0")
  const map: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    MMMM: months[date.getMonth()],
    MMM: monthsShort[date.getMonth()],
    MM: p(date.getMonth() + 1),
    dd: p(date.getDate()),
    EEEE: daysShort[date.getDay()],
    EEE: daysShort[date.getDay()],
    HH: p(date.getHours()),
    mm: p(date.getMinutes()),
    d: String(date.getDate()),
  }
  let r = pattern
  for (const [k, v] of Object.entries(map)) r = r.split(k).join(v)
  return r
}

export function calcDuration(start: string, end: string): number {
  const toM = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m }
  const s = toM(start)
  let e = toM(end)
  if (e <= s) e += 1440
  return e - s
}

export function calcEndTime(start: string, dur: number): string {
  const [h, m] = start.split(":").map(Number)
  const t = h * 60 + m + dur
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
}

export function getMonthDays(date: Date): Date[][] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay() // 0=Sun
  const totalDays = lastDay.getDate()

  const weeks: Date[][] = []
  let week: Date[] = []

  // Padding days from previous month
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    d.setHours(0, 0, 0, 0)
    week.push(d)
  }

  // Actual days
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d)
    dateObj.setHours(0, 0, 0, 0)
    week.push(dateObj)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  // Padding days from next month
  if (week.length > 0) {
    const remaining = 7 - week.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      d.setHours(0, 0, 0, 0)
      week.push(d)
    }
    weeks.push(week)
  }

  return weeks
}

export function getWeekDays(date: Date): Date[] {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  const days: Date[] = [new Date(d)]
  for (let i = 1; i < 7; i++) { const n = new Date(d); n.setDate(n.getDate() + i); days.push(n) }
  return days
}

export function isToday(date: Date): boolean {
  const t = new Date()
  return date.getFullYear() === t.getFullYear() && date.getMonth() === t.getMonth() && date.getDate() === t.getDate()
}

export function checkOverlap(a: string, b: string, c: string, d: string): boolean {
  const t = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m }
  const s1 = t(a), s2 = t(c)
  let e1 = t(b), e2 = t(d)
  if (e1 <= s1) e1 += 1440
  if (e2 <= s2) e2 += 1440
  return s1 < e2 && s2 < e1
}

export function formatDuration(start: string, end: string): string {
  const m = calcDuration(start, end)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ""}`.trim()
}

export function generateTimeSlots(start: string, end: string, interval = 60): string[] {
  const slots: string[] = []
  let [h, m] = start.split(":").map(Number)
  const em = end.split(":").map(Number)
  const endM = em[0] * 60 + em[1]
  while (h * 60 + m < endM) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    m += interval
    h += Math.floor(m / 60)
    m = m % 60
    h = h % 24
  }
  return slots
}

export function generateRecurringBlocks<T extends { recurring?: boolean; recurringPattern?: string; date: string; recurringStartDate?: string; recurringEndDate?: string }>(base: T) {
  if (!base.recurring || !base.recurringPattern) return [base]
  const blocks: typeof base[] = []
  const start = new Date(base.recurringStartDate || base.date)
  const end = base.recurringEndDate ? new Date(base.recurringEndDate) : new Date(start.getTime() + 28 * 86400000)
  const cur = new Date(start)
  let i = 0
  while (cur <= end && i < 365) {
    const b = { ...base, id: crypto.randomUUID(), date: formatDate(cur), focusSessions: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    blocks.push(b)
    i++
    if (base.recurringPattern === "daily") cur.setDate(cur.getDate() + 1)
    else if (base.recurringPattern === "weekly") cur.setDate(cur.getDate() + 7)
    else if (base.recurringPattern === "monthly") cur.setMonth(cur.getMonth() + 1)
    else break
  }
  return blocks
}
