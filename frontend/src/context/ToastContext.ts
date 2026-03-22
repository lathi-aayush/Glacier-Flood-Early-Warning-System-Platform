import { createContext } from 'react'

export type ToastVariant = 'error' | 'warning' | 'info' | 'success'

export type ToastContextValue = {
  pushToast: (t: { message: string; variant?: ToastVariant }) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
