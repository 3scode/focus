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
    <div className="flex flex-col items-center gap-1 p-4 bg-surface rounded-radius-md border border-border min-w-[100px]">
      <Icon className={`w-5 h-5 ${accentMap[variant]}`} />
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-caption text-text-secondary">{label}</span>
    </div>
  )
}
