import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface InfoTooltipProps {
  content: string
  title?: string
  position?: 'top' | 'bottom'
  className?: string
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  title,
  position = 'top',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; placeBottom: boolean }>({
    top: 0,
    left: 0,
    placeBottom: false,
  })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const tooltipWidth = 240
    const tooltipEstimatedHeight = 90

    // Center horizontally on the trigger, but keep inside viewport bounds with 12px padding
    let left = rect.left + rect.width / 2 - tooltipWidth / 2
    left = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, left))

    // Place below if not enough space above
    const placeBottom = position === 'bottom' || rect.top - tooltipEstimatedHeight < 12
    const top = placeBottom ? rect.bottom + 6 : rect.top - 6

    setCoords({ top, left, placeBottom })
  }, [position])

  const show = () => {
    updatePosition()
    setIsOpen(true)
  }

  const hide = () => {
    setIsOpen(false)
  }

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isOpen) {
      hide()
    } else {
      show()
    }
  }

  // Update position on window resize or scroll
  useEffect(() => {
    if (!isOpen) return

    const handleScrollOrResize = () => {
      updatePosition()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        hide()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide()
    }

    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, updatePosition])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex items-center justify-center cursor-pointer select-none p-0.5 ${className}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={toggle}
        onFocus={show}
        onBlur={hide}
        aria-label={title || content}
      >
        <span className="w-3.5 h-3.5 rounded-full border border-slate-600/80 bg-slate-800/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/60 flex items-center justify-center text-[9px] font-mono font-bold transition-all shadow-sm">
          i
        </span>
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              top: coords.placeBottom ? coords.top : 'auto',
              bottom: coords.placeBottom ? 'auto' : `${window.innerHeight - coords.top}px`,
              left: coords.left,
              width: 240,
              zIndex: 999999,
            }}
            className="p-3 rounded-lg bg-slate-900/95 border border-cyan-500/50 text-slate-200 text-[11px] leading-relaxed shadow-2xl backdrop-blur-md pointer-events-auto transition-opacity duration-150 animate-in fade-in zoom-in-95"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={hide}
          >
            {title && (
              <div className="font-semibold text-cyan-300 mb-1.5 pb-1 border-b border-slate-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>{title}</span>
              </div>
            )}
            <p className="text-slate-300 font-normal leading-normal">{content}</p>
          </div>,
          document.body,
        )}
    </>
  )
}
