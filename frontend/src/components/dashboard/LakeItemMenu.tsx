import { useState, useRef, useEffect, useCallback } from 'react'
import type { Lake } from '@/types/lake'
import { useToast } from '@/hooks/useToast'

interface LakeItemMenuProps {
  lake: Lake
  isWatchlisted: boolean
  onToggleWatchlist: (lake: Lake) => void
}

export function LakeItemMenu({ lake, isWatchlisted, onToggleWatchlist }: LakeItemMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { pushToast } = useToast()

  const handleToggleOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen((prev) => !prev)
  }, [])

  const handleWatchlistClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setOpen(false)
      onToggleWatchlist(lake)
    },
    [lake, onToggleWatchlist],
  )

  const handleCopyId = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      setOpen(false)
      const textToCopy = `${lake.name} [ID: ${lake.id} | Node: ${lake.nodeId}]`
      try {
        await navigator.clipboard.writeText(textToCopy)
        pushToast({ message: `Copied details for ${lake.name}`, variant: 'success' })
      } catch {
        pushToast({ message: `Lake ID: ${lake.id}`, variant: 'info' })
      }
    },
    [lake, pushToast],
  )

  useEffect(() => {
    if (!open) return

    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggleOpen}
        className="rounded p-1 text-on-surface-variant/70 transition-colors hover:bg-surface-container-highest hover:text-on-surface focus:outline-none"
        aria-label={`Options for ${lake.name}`}
        aria-expanded={open}
        title="More options"
      >
        <span className="material-symbols-outlined text-base">more_vert</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[170px] rounded-lg border border-outline-variant/20 bg-surface-container-highest/95 p-1 shadow-2xl backdrop-blur-md"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleWatchlistClick}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <span
              className={`material-symbols-outlined text-sm ${
                isWatchlisted ? 'text-amber-400' : 'text-on-surface-variant'
              }`}
              style={isWatchlisted ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {isWatchlisted ? 'star' : 'star_border'}
            </span>
            <span>{isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleCopyId}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-sm text-on-surface-variant">content_copy</span>
            <span>Copy lake ID</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
