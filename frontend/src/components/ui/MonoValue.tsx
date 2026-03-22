import type { ReactNode } from 'react'

const sizes = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-lg',
  xl: 'text-2xl',
} as const

type MonoValueProps = {
  children: ReactNode
  className?: string
  size?: keyof typeof sizes
}

/** Coordinates, timestamps, IDs — JetBrains Mono */
export function MonoValue({ children, className = '', size = 'md' }: MonoValueProps) {
  return <span className={`font-mono tabular-nums ${sizes[size]} ${className}`.trim()}>{children}</span>
}
