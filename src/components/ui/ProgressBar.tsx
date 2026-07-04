"use client"

interface ProgressBarProps {
  value: number
  variant?: "horizontal" | "minimal"
  showLabel?: boolean
  color?: string
}

export function ProgressBar({
  value,
  variant = "horizontal",
  showLabel = true,
  color,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="flex items-center gap-3">
      {variant === "horizontal" && (
        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clamped}%`, backgroundColor: color ?? "var(--color-primary)" }}
          />
        </div>
      )}
      {variant === "minimal" && (
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clamped}%`, backgroundColor: color ?? "var(--color-primary)" }}
          />
        </div>
      )}
      {showLabel && (
        <span className="text-caption text-text-secondary whitespace-nowrap tabular-nums">
          {clamped}%
        </span>
      )}
    </div>
  )
}
