import type { ReactNode } from 'react'
import { Button } from './Button'

export type ConfirmVariant = 'danger' | 'primary'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  cancelLabel?: string
  variant?: ConfirmVariant
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={() => onConfirm()}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
