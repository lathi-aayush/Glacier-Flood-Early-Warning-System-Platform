import { useEffect, useState, useRef, useCallback } from 'react'
import { fetchSystemHealth, type SystemHealthResponse } from '@/api/healthApi'

type HealthState = 'checking' | 'online' | 'degraded' | 'waking'

export function SystemStatusButton() {
  const [status, setStatus] = useState<HealthState>('checking')
  const [data, setData] = useState<SystemHealthResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetchSystemHealth()
      setData(res)
      setErrorMsg(null)
      if (res.status === 'ok' && res.database === 'ok') {
        setStatus('online')
      } else {
        setStatus('degraded')
      }
    } catch (err: any) {
      // Backend is likely waking up from Render spin-down
      setStatus('waking')
      setErrorMsg(err.message || 'Server waking up...')
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void checkHealth()
    const interval = setInterval(() => {
      void checkHealth()
    }, 15000)
    return () => clearInterval(interval)
  }, [checkHealth])

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [popoverOpen])

  const isUp = status === 'online'

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Simple status button replacing settings icon */}
      <button
        type="button"
        onClick={() => setPopoverOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium font-mono border transition-all shadow-sm ${
          isUp
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-red-500/15 border-red-500/50 text-red-400 hover:bg-red-500/25 animate-pulse'
        }`}
        title={
          isUp
            ? 'Backend & Database are Online'
            : 'Backend / Database is waking up on Render'
        }
        aria-label="System status"
      >
        {/* Pulsing indicator dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          {!isUp && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isUp ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]' : 'bg-red-500'
            }`}
          />
        </span>

        <span className="whitespace-nowrap">
          {status === 'checking' && 'Checking API...'}
          {status === 'online' && 'API & DB: Online'}
          {status === 'degraded' && 'API: Degraded'}
          {status === 'waking' && 'Backend / DB Starting Up...'}
        </span>
      </button>

      {/* Popover showing Backend & Database Health details */}
      {popoverOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-lg border border-outline-variant/30 bg-surface-container-high p-3.5 text-xs text-on-surface shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2 mb-2.5">
            <div className="font-semibold text-primary">System Infrastructure</div>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => void checkHealth()}
              className="text-[10px] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[12px] ${isRefreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
              {isRefreshing ? 'Checking...' : 'Ping'}
            </button>
          </div>

          <div className="space-y-2">
            {/* Backend API status */}
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-medium">Backend API:</span>
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                  isUp
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-red-500'}`} />
                {isUp ? 'Online (FastAPI)' : 'Waking up on Render...'}
              </span>
            </div>

            {/* Database status */}
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-medium">Database:</span>
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                  data?.database === 'ok'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${data?.database === 'ok' ? 'bg-emerald-400' : 'bg-red-500'}`}
                />
                {data?.database === 'ok' ? 'Connected (OK)' : 'Connecting / Starting...'}
              </span>
            </div>

            {/* Copernicus Satellite Sync */}
            {data?.copernicus && (
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Satellite Sync:</span>
                <span className="font-mono text-[10px] text-on-surface-variant">
                  {data.copernicus.worker?.lakes_synced ?? 14}/{data.copernicus.worker?.lakes_total ?? 14} lakes
                </span>
              </div>
            )}

            {errorMsg && !isUp && (
              <div className="rounded bg-red-500/10 border border-red-500/20 p-1.5 text-[10px] text-red-300">
                Render response: {errorMsg}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-outline-variant/15 text-[10px] text-on-surface-variant/80 truncate">
            Host: <span className="font-mono">glacier-flood-early-warning-system.onrender.com</span>
          </div>
        </div>
      )}
    </div>
  )
}
