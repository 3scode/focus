"use client"

import { type LucideIcon } from "lucide-react"

interface StatCardProps {
  value: string | number
  label: string
  variant?: "positive" | "warning" | "primary"
  icon: LucideIcon
}

const accentMap: Record<string, string> = {
  positive: "text-[#22C55E]",
  warning: "text-[#F59E0B]",
  primary: "text-[#5E6AD2]",
}

export function StatCard({ value, label, variant = "primary", icon: Icon }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 p-3 min-w-[80px] rounded-xl transition-all duration-200"
      style={{
        background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 2px 20px rgba(0,0,0,0.4)",
      }}
    >
      <Icon className={`w-4 h-4 ${accentMap[variant]}`} />
      <span className="text-lg font-bold tabular-nums text-[#EDEDEF]">{value}</span>
      <span className="text-xs text-[#8A8F98]">{label}</span>
    </div>
  )
}
