import type { ReactNode } from 'react'

type SectionLabelProps = {
  children: ReactNode
  className?: string
  as?: 'p' | 'span' | 'h3'
}

/** DESIGN.md — label-sm all-caps technical labels */
export function SectionLabel({ children, className = '', as: Tag = 'p' }: SectionLabelProps) {
  return (
    <Tag
      className={`text-[10px] font-bold uppercase tracking-[0.2em] text-outline font-label ${className}`.trim()}
    >
      {children}
    </Tag>
  )
}
