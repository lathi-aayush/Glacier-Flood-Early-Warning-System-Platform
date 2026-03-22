import type { ReactNode } from 'react'

type CardVariant = 'inset' | 'raised' | 'panel'

const variants: Record<CardVariant, string> = {
  inset: 'bg-surface-container-lowest',
  raised: 'bg-surface-container-high',
  panel: 'bg-surface-container',
}

type CardProps = {
  children: ReactNode
  className?: string
  variant?: CardVariant
  /** Ghost border ~15% outline-variant (DESIGN.md) */
  ghostBorder?: boolean
}

/** Tonal layering — avoid heavy drop shadows */
export function Card({ children, className = '', variant = 'panel', ghostBorder }: CardProps) {
  const border = ghostBorder ? 'border border-outline-variant/15' : ''
  return (
    <div className={`rounded-lg ${variants[variant]} ${border} ${className}`.trim()}>{children}</div>
  )
}
