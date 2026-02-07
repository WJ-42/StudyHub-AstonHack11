import { useEffect } from 'react'

export type ToastVariant = 'success' | 'info' | 'error'

interface ToastProps {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number
  onClose: (id: string) => void
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-600 text-white dark:bg-green-700',
  info: 'bg-blue-600 text-white dark:bg-blue-700',
  error: 'bg-red-600 text-white dark:bg-red-700',
}

export function Toast({ id, message, variant = 'info', duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return
    const t = setTimeout(() => onClose(id), duration)
    return () => clearTimeout(t)
  }, [id, duration, onClose])

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 shadow-lg ${variantStyles[variant]}`}
      role="status"
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        type="button"
        className="rounded p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close"
        onClick={() => onClose(id)}
      >
        ×
      </button>
    </div>
  )
}
