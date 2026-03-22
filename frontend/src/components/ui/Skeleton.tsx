type SkeletonProps = {
  className?: string
  /** Screen-reader text */
  label?: string
}

export function Skeleton({ className = '', label = 'Loading' }: SkeletonProps) {
  return (
    <span
      className={`inline-block animate-pulse rounded bg-surface-container-highest/80 ${className}`.trim()}
      aria-hidden={label ? undefined : true}
      role={label ? 'status' : undefined}
      aria-label={label}
    />
  )
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`.trim()} role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" label="" />
      ))}
    </div>
  )
}
