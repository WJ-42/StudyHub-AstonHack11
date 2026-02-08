import { createContext, useCallback, useContext, useState } from 'react'
import { Toast } from '@/components/ui/Toast'
import type { ToastVariant } from '@/components/ui/Toast'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0
function nextId() {
  return `toast-${++toastId}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 4000) => {
    const id = nextId()
    setToasts((prev) => [...prev, { id, message, variant, duration }])
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div data-toast-container className="fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            message={t.message}
            variant={t.variant}
            duration={t.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
