"use client"

import { type LucideIcon } from "lucide-react"

interface StatCardProps {
  value: string | number
  label: string
  variant?: "positive" | "warning" | "primary"
  icon: LucideIcon
}

const accentMap = {
  positive: "text-success",
  warning: "text-secondary",
  primary: "text-primary",
}

export function StatCard({ value, label, variant = "primary", icon: Icon }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 p-2 bg-surface rounded-radius-md border border-border min-w-[80px]">
      <Icon className={`w-4 h-4 ${accentMap[variant]}`} />
      <span className="text-lg font-bold tabular-nums">{value}</span>
      <span className="text-caption text-text-secondary">{label}</span>
    </div>
  )
}
