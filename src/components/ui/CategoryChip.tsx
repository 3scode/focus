"use client"

interface CategoryChipProps {
  label: string
  color: string
  selected: boolean
  editable?: boolean
  onSelect: () => void
  onEdit?: () => void
}

export function CategoryChip({
  label,
  color,
  selected,
  editable,
  onSelect,
  onEdit,
}: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={editable ? onEdit : onSelect}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-radius-full text-caption font-medium
        transition-all duration-150
        ${selected
          ? "text-white border-transparent"
          : "bg-surface border border-border text-text-secondary hover:bg-background"
        }
      `}
      style={selected ? { backgroundColor: color } : undefined}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: selected ? "white" : color }}
      />
      {label}
    </button>
  )
}
