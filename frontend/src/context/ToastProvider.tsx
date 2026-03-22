import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastVariant } from '@/context/ToastContext'

type ToastItem = { id: number; message: string; variant: ToastVariant }

const variantClass: Record<ToastVariant, string> = {
  error: 'border-error/40 bg-error-container/25 text-error',
  warning: 'border-primary/35 bg-surface-container-high/95 text-primary',
  info: 'border-outline-variant/20 bg-surface-container/95 text-on-surface',
  success: 'border-secondary/35 bg-secondary-container/20 text-secondary',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const pushToast = useCallback((t: { message: string; variant?: ToastVariant }) => {
    const id = ++idRef.current
    const variant = t.variant ?? 'info'
    setToasts((prev) => [...prev, { id, message: t.message, variant }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 5200)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[200] flex max-w-sm flex-col gap-2 p-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm backdrop-blur-md ${variantClass[t.variant]}`.trim()}
          >
            <span>{t.message}</span>
            <button
              type="button"
              className="shrink-0 rounded px-1 text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
