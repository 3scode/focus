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

  const trackStyle = { background: "rgba(255,255,255,0.06)" }

  return (
    <div className="flex items-center gap-3">
      {variant === "horizontal" && (
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={trackStyle}>
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clamped}%`, backgroundColor: color ?? "#5E6AD2" }}
          />
        </div>
      )}
      {variant === "minimal" && (
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={trackStyle}>
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clamped}%`, backgroundColor: color ?? "#5E6AD2" }}
          />
        </div>
      )}
      {showLabel && (
        <span className="text-xs text-[#8A8F98] whitespace-nowrap tabular-nums">
          {clamped}%
        </span>
      )}
    </div>
  )
}
