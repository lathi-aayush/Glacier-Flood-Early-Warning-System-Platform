/**
 * Timeline + map opacity are mock-driven on the client. When the backend exposes
 * `GET /replay/{event_id}`, wire `fetchReplayEvent` from `@/api/replayApi` here.
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { REPLAY_EVENTS, replaySampleAt } from '@/mocks/replay'

const ReplayMap = lazy(() => import('@/components/map/ReplayMap').then((m) => ({ default: m.ReplayMap })))

export function HistoricalReplayPage() {
  const [eventIdx, setEventIdx] = useState(0)
  const [t, setT] = useState(0.33)
  const [playing, setPlaying] = useState(false)
  const raf = useRef<number | null>(null)
  const meta = REPLAY_EVENTS[eventIdx] ?? REPLAY_EVENTS[0]!
  const sample = useMemo(() => replaySampleAt(t), [t])

  useEffect(() => {
    if (!playing) {
      if (raf.current != null) cancelAnimationFrame(raf.current)
      raf.current = null
      return
    }
    let last = performance.now()
    const step = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((prev) => {
        const n = prev + dt * 0.03
        return n > 1 ? 0 : n
      })
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current)
    }
  }, [playing])

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        setPlaying((p) => !p)
      }
      if (e.key === 'ArrowLeft') setT((x) => Math.max(0, x - 0.02))
      if (e.key === 'ArrowRight') setT((x) => Math.min(1, x + 0.02))
    },
    [],
  )

  useEffect(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onKey])

  return (
    <div className="flex min-h-dvh flex-col bg-background text-on-surface">
      <TopNav />
      <div className="flex h-12 shrink-0 items-center justify-center border-b border-outline-variant/15 bg-surface-container px-4 md:px-12">
        <label className="sr-only" htmlFor="replay-event">
          Select replay event
        </label>
        <select
          id="replay-event"
          className="w-full max-w-xl rounded-t-sm border-b-2 border-primary/30 bg-surface-container-lowest px-4 py-2 font-headline text-xs font-medium uppercase tracking-widest text-on-surface hover:border-primary"
          value={eventIdx}
          onChange={(e) => {
            setEventIdx(Number(e.target.value))
            setT(0)
            setPlaying(false)
          }}
        >
          {REPLAY_EVENTS.map((ev, i) => (
            <option key={ev.id} value={i}>
              Event: {ev.label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden style={{
          backgroundImage: `linear-gradient(to right, #3e484f 1px, transparent 1px), linear-gradient(to bottom, #3e484f 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }} />
        <section className="relative min-w-0 flex-1 bg-surface-container-lowest">
          <Suspense
            fallback={<div className="flex h-full items-center justify-center text-on-surface-variant">Loading map…</div>}
          >
            <ReplayMap lakeLat={meta.lakeLat} lakeLng={meta.lakeLng} pathOpacity={sample.pathOpacity} />
          </Suspense>
          <div className="pointer-events-none absolute left-8 top-8 space-y-4">
            <div className="w-64 border-l-2 border-primary bg-surface-container/80 p-4 backdrop-blur-md">
              <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-primary">Coordinates</p>
              <p className="font-mono text-lg text-on-surface">
                {meta.lakeLat.toFixed(4)}° N, {meta.lakeLng.toFixed(4)}° E
              </p>
              <p className="mb-1 mt-3 text-[10px] uppercase tracking-[0.2em] text-outline">Replay risk (mock)</p>
              <p className="font-mono text-lg text-on-surface">
                {sample.risk} — {sample.riskLabel}
              </p>
            </div>
            <div className="w-64 border-l-2 border-error bg-surface-container/80 p-4 backdrop-blur-md">
              <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-error">Discharge (mock)</p>
              <div className="flex items-end justify-between">
                <span className="font-mono text-2xl font-bold text-on-surface">{sample.discharge.toLocaleString()}</span>
                <span className="mb-1 text-[10px] text-outline-variant">m³/s</span>
              </div>
            </div>
          </div>
        </section>
        <aside className="z-10 flex w-96 flex-col overflow-y-auto border-l border-outline-variant/15 bg-surface-container p-6">
          <header className="mb-8">
            <h3 className="font-headline text-xl font-bold text-on-surface">Telemetry analysis</h3>
            <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">Impact analysis matrix (mock)</p>
          </header>
          <div className="space-y-6">
            <div className="rounded-lg border-b border-primary-container/20 bg-surface-container-lowest p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-outline">Risk index</span>
                <span className="font-mono text-xs text-primary">SCRUB_SYNC</span>
              </div>
              <div className="flex h-32 items-end gap-1">
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = 20 + ((i / 11 - t) ** 2) * 80
                  return (
                    <div
                      key={i}
                      className="w-2 rounded-sm bg-secondary/40"
                      style={{ height: `${Math.min(100, Math.max(8, h))}%`, opacity: 0.35 + (i / 12) * 0.5 }}
                    />
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-l-4 border-error bg-surface-container-high p-4">
                <p className="text-[10px] font-bold uppercase text-outline">Flood risk</p>
                <p className="font-headline text-2xl font-bold text-error">{sample.riskLabel}</p>
              </div>
              <div className="border-l-4 border-secondary bg-surface-container-high p-4">
                <p className="text-[10px] font-bold uppercase text-outline">Path vis</p>
                <p className="font-headline text-2xl font-bold text-secondary">{Math.round(sample.pathOpacity * 100)}%</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <div className="z-20 flex h-24 shrink-0 items-center gap-8 border-t border-outline-variant/20 bg-surface-container/95 px-8 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high"
            aria-label="Back 10 seconds"
            onClick={() => setT((x) => Math.max(0, x - 0.05))}
          >
            <span className="material-symbols-outlined">replay_10</span>
          </button>
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => setPlaying((p) => !p)}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {playing ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high"
            aria-label="Forward 10 seconds"
            onClick={() => setT((x) => Math.min(1, x + 0.05))}
          >
            <span className="material-symbols-outlined">forward_10</span>
          </button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="mb-1 flex items-end justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-headline text-2xl font-bold tracking-tight text-primary font-mono">{meta.startLabel}</span>
              <span className="font-headline text-xl font-light text-on-surface-variant font-mono">{sample.clock}</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-outline">Duration: {meta.durationLabel}</div>
          </div>
          <div className="group relative flex h-10 cursor-pointer items-center touch-pan-x">
            <div className="absolute h-1 w-full rounded-full bg-surface-container-highest" />
            <div
              className="absolute h-1 rounded-full bg-primary shadow-[0_0_12px_rgba(154,219,255,0.4)]"
              style={{ width: `${t * 100}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(t * 100)}
              onChange={(e) => setT(Number(e.target.value) / 100)}
              className="replay-scrubber absolute inset-0 z-10 w-full cursor-pointer opacity-0"
              aria-label="Replay timeline"
            />
            <div
              className="absolute z-[5] h-4 w-4 -translate-x-1/2 rounded-full border-4 border-on-primary bg-primary shadow-lg transition-transform group-hover:scale-125"
              style={{ left: `${t * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-on-surface-variant">
            Space: play/pause · ←/→: nudge · scrubber is touch-friendly
          </p>
        </div>
      </div>
    </div>
  )
}
