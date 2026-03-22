export function PageSpinner({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-background px-6 text-on-surface-variant">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-outline-variant border-t-primary"
        aria-hidden
      />
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {message}
      </p>
    </div>
  )
}
