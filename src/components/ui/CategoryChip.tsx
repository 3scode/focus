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
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        transition-all duration-150
        ${selected
          ? "text-white border-transparent"
          : "text-[#8A8F98] hover:text-[#EDEDEF]"
        }
      `}
      style={selected ? { backgroundColor: color } : {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: selected ? "white" : color }}
      />
      {label}
    </button>
  )
}
