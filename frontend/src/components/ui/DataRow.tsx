import type { ReactNode } from 'react'
import { SectionLabel } from '@/components/ui/SectionLabel'

type DataRowProps = {
  label: string
  children: ReactNode
  className?: string
  /** Use SectionLabel styling for label */
  dense?: boolean
}

export function DataRow({ label, children, className = '', dense }: DataRowProps) {
  return (
    <div className={className}>
      {dense ? (
        <p className="font-label text-xs uppercase tracking-tighter text-on-surface-variant">{label}</p>
      ) : (
        <SectionLabel className="mb-1 text-on-surface-variant tracking-widest">{label}</SectionLabel>
      )}
      <div className="text-on-surface">{children}</div>
    </div>
  )
}
