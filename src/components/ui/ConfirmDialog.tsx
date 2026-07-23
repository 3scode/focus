"use client"

import { Modal } from "./Modal"

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Ya, tandai selesai",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-[#8A8F98] mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg text-[#8A8F98] hover:text-[#EDEDEF] transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded-lg bg-[#5E6AD2] text-white hover:bg-[#6872D9] transition-all duration-200 shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
