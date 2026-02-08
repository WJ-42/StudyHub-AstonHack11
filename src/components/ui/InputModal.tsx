import { useState, useEffect } from 'react'
import { Button } from './Button'

interface InputModalProps {
  open: boolean
  title: string
  label: string
  defaultValue?: string
  submitLabel?: string
  cancelLabel?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

export function InputModal({
  open,
  title,
  label,
  defaultValue = '',
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    if (open) {
      console.log('🟡 InputModal opened with defaultValue:', defaultValue)
      setValue(defaultValue)
    }
  }, [open, defaultValue])

  if (!open) return null

  console.log('🟡 InputModal rendering, open:', open, 'value:', value)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed) {
      onSubmit(trimmed)
    }
    onCancel()
  }

  const handleClose = () => {
    setValue(defaultValue)
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200" role="dialog" aria-modal="true" aria-labelledby="input-modal-title">
      <div className="absolute inset-0 bg-black/50 transition-opacity duration-200" aria-hidden onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl animate-fade-in-up dark:border-slate-700 dark:bg-slate-800">
        <h2 id="input-modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        <label htmlFor="input-modal-field" className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <input
          id="input-modal-field"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) handleSubmit()
            if (e.key === 'Escape') handleClose()
          }}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          autoFocus
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!value.trim()}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
