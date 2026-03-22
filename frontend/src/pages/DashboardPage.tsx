import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { MonoValue } from '@/components/ui/MonoValue'
import { TierBadge } from '@/components/ui/StatusChip'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Skeleton } from '@/components/ui/Skeleton'
import { useLakeSelection } from '@/hooks/useLakeSelection'
import { useToast } from '@/hooks/useToast'
import { openSitRepPrintWindow } from '@/lib/sitrepPrint'
import type { Lake } from '@/types/lake'

const DashboardMap = lazy(() =>
  import('@/components/map/DashboardMap').then((m) => ({ default: m.DashboardMap })),
)

function tierFilterMatch(lake: Lake, filter: string): boolean {
  if (filter === 'all') return true
  return lake.tier === filter
}

export function DashboardPage() {
  const { lakes, lakesLoading, selectedId, selectedLake, setSelectedId, syncFromRouteLakeParam } =
    useLakeSelection()
  const { pushToast } = useToast()
  const [searchParams] = useSearchParams()
  const [sidebarQuery, setSidebarQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  /** Session-only: operator acknowledged the critical alert for a given lake */
  const [acknowledgedByLakeId, setAcknowledgedByLakeId] = useState<Record<string, true>>({})

  useEffect(() => {
    const q = searchParams.get('lake')
    syncFromRouteLakeParam(q)
  }, [searchParams, syncFromRouteLakeParam])

  const sidebarLakes = useMemo(() => {
    const q = sidebarQuery.trim().toLowerCase()
    return lakes.filter((l) => tierFilterMatch(l, tierFilter)).filter((l) => {
      if (!q) return true
      return (
        l.name.toLowerCase().includes(q) ||
        l.basin.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q) ||
        l.nodeId.toLowerCase().includes(q)
      )
    })
  }, [lakes, sidebarQuery, tierFilter])

  const criticalNeedsAck =
    selectedLake.tier === 'critical' && !acknowledgedByLakeId[selectedLake.id]

  const handleAcknowledge = useCallback(() => {
    if (selectedLake.tier !== 'critical') {
      pushToast({ message: 'No critical alert to acknowledge for this lake.', variant: 'info' })
      return
    }
    if (acknowledgedByLakeId[selectedLake.id]) {
      pushToast({ message: 'This alert was already acknowledged.', variant: 'info' })
      return
    }
    setAcknowledgedByLakeId((m) => ({ ...m, [selectedLake.id]: true }))
    pushToast({ message: `Alert acknowledged for ${selectedLake.name}.`, variant: 'success' })
  }, [acknowledgedByLakeId, pushToast, selectedLake.id, selectedLake.name, selectedLake.tier])

  const handleSitRepPdf = useCallback(async () => {
    try {
      const result = await openSitRepPrintWindow(selectedLake)
      if (result === 'failed') {
        pushToast({
          message: 'Could not export the SitRep. Try another browser or check download permissions.',
          variant: 'error',
        })
        return
      }
      if (result === 'download') {
        pushToast({
          message: 'Saved SitRep as an HTML file. Open it and use Print → Save as PDF.',
          variant: 'info',
        })
        return
      }
      pushToast({
        message: 'Print dialog opened — choose Save as PDF or a printer.',
        variant: 'info',
      })
    } catch {
      pushToast({ message: 'SitRep export failed.', variant: 'error' })
    }
  }, [pushToast, selectedLake])

  const banner = criticalNeedsAck ? (
    <div className="flex w-full shrink-0 animate-pulse items-center justify-between border-b border-error/30 bg-error-container/20 px-6 py-2 text-error">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined font-bold">warning</span>
        <span className="font-headline font-bold tracking-tight">
          CRITICAL ALERT — {selectedLake.name} — SMS dispatched to {selectedLake.smsSent} contacts — 6h window
          active
        </span>
      </div>
      <button
        type="button"
        onClick={handleAcknowledge}
        className="rounded bg-error px-3 py-1 text-xs font-bold uppercase tracking-tighter text-on-error"
      >
        Acknowledge
      </button>
    </div>
  ) : null

  return (
    <AppShell banner={banner} mainClassName="relative flex min-h-0 flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
      <aside className="z-40 flex w-[20%] min-w-[280px] flex-col border-r border-outline-variant/15 bg-surface-container">
        <div className="space-y-4 p-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">
              search
            </span>
            <input
              className="w-full rounded border-none bg-surface-container-lowest py-2 pl-10 text-sm text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary"
              placeholder="Search lakes, basins, states…"
              value={sidebarQuery}
              onChange={(e) => setSidebarQuery(e.target.value)}
              type="search"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'critical', 'advisory', 'safe'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTierFilter(t)}
                className={[
                  'rounded-full px-3 py-1 text-[10px] font-bold uppercase',
                  tierFilter === t && t === 'critical'
                    ? 'border border-error text-error'
                    : tierFilter === t && t === 'all'
                      ? 'bg-primary text-on-primary'
                      : tierFilter === t
                        ? 'bg-surface-container-high text-on-surface-variant'
                        : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-high',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="rounded border-none bg-surface-container-lowest py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <option>STATE: ALL</option>
              <option>SIKKIM</option>
              <option>HIMACHAL</option>
            </select>
            <select className="rounded border-none bg-surface-container-lowest py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <option>BASIN: ALL</option>
              <option>TEESTA</option>
            </select>
          </div>
          {lakesLoading ? (
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant" role="status">
              Syncing lake index…
            </p>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
          {lakesLoading ? (
            <div className="space-y-2" role="status" aria-label="Loading lakes">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] w-full rounded-md" label="" />
              ))}
            </div>
          ) : (
            sidebarLakes.map((lake) => {
              const active = lake.id === selectedId
              return (
                <button
                  key={lake.id}
                  type="button"
                  onClick={() => setSelectedId(lake.id)}
                  className={[
                    'group w-full cursor-pointer p-3 text-left transition-all',
                    active ? 'border-l-4 border-error bg-surface-container-high' : 'border-l-4 border-transparent hover:bg-surface-container-high/50',
                  ].join(' ')}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-headline font-bold leading-tight text-on-surface">{lake.name}</h3>
                      <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant">
                        Node ID: {lake.nodeId}
                      </p>
                    </div>
                    <TierBadge tier={lake.tier} />
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>
      <section className="relative min-w-0 flex-1 overflow-hidden bg-surface-container-lowest">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-surface-container-lowest text-on-surface-variant">
              Loading map…
            </div>
          }
        >
          <DashboardMap lakes={lakes} selectedId={selectedId} onSelectLake={setSelectedId} />
        </Suspense>
        <div className="pointer-events-none absolute right-4 top-4 flex justify-end">
          <div className="pointer-events-auto rounded-lg border border-outline-variant/10 bg-surface-container-high/80 p-4 backdrop-blur-md">
            <SectionLabel className="mb-2 !text-xs tracking-tighter text-outline">Coordinates</SectionLabel>
            <MonoValue size="md" className="!text-sm text-primary">
              {selectedLake.lat.toFixed(4)}° N, {selectedLake.lng.toFixed(4)}° E
            </MonoValue>
          </div>
        </div>
      </section>
      <aside className="z-40 flex w-[30%] min-w-[380px] flex-col overflow-y-auto bg-surface">
        <div className="space-y-8 p-6 md:p-7">
          <div className="space-y-3">
            <h2 className="font-headline text-3xl font-extrabold tracking-tighter md:text-4xl">{selectedLake.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <TierBadge tier={selectedLake.tier} />
            </div>
            <div>
              <SectionLabel className="mb-1 block !text-xs text-outline tracking-widest">Global Watch ID</SectionLabel>
              <MonoValue size="md" className="!text-sm text-on-surface-variant">
                {selectedLake.watchId}
              </MonoValue>
            </div>
          </div>
          <div className="space-y-5">
            <SectionLabel className="!text-xs text-primary tracking-[0.2em]">Live telemetry signals</SectionLabel>
            <div className="space-y-4">
              <TelemetryRow label="Water level change" value={`+${selectedLake.telemetry.waterLevelMPerHr}m / hr`} valueClass="text-error" pct={0.8} barClass="bg-error" />
              <TelemetryRow
                label="Seismic activity (local)"
                value={`${selectedLake.telemetry.seismicMag} Mag`}
                valueClass="text-secondary"
                pct={0.33}
                barClass="bg-secondary"
              />
              <TelemetryRow
                label="Surface area delta"
                value={`+${selectedLake.telemetry.areaDeltaPct}% area`}
                valueClass="text-primary"
                pct={0.5}
                barClass="bg-primary"
              />
            </div>
          </div>
          <Card variant="inset" ghostBorder className="space-y-4 p-5">
            <SectionLabel className="!text-xs text-on-tertiary-fixed-variant tracking-widest">
              AI decision rationale (SHAP)
            </SectionLabel>
            <div className="space-y-3">
              {selectedLake.shap.map((row) => (
                <div key={row.feature} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 font-mono text-xs text-outline">{row.feature}</span>
                  <div className="flex min-w-0 flex-grow items-center">
                    <div
                      className={[
                        'h-4 rounded-sm',
                        row.direction === 'up' ? 'rounded-r-sm bg-error' : 'rounded-l-sm bg-secondary',
                      ].join(' ')}
                      style={{ width: `${Math.min(100, Math.abs(row.value) * 400)}%` }}
                    />
                  </div>
                  <span
                    className={[
                      'shrink-0 font-mono text-xs tabular-nums',
                      row.direction === 'up' ? 'text-error' : 'text-secondary',
                    ].join(' ')}
                  >
                    {row.direction === 'up' ? '+' : ''}
                    {row.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-sm leading-relaxed text-on-surface-variant">
              MODEL DETERMINATION: driven by precipitation windows, thermal context, and lake-area deltas —
              indicative only; not operational hazard guidance.
            </p>
          </Card>
          <div className="space-y-5 rounded-xl border border-error/20 bg-error-container/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'h-2.5 w-2.5 rounded-full',
                    selectedLake.tier === 'critical' && !acknowledgedByLakeId[selectedLake.id]
                      ? 'animate-pulse bg-error'
                      : 'bg-secondary',
                  ].join(' ')}
                />
                <span
                  className={[
                    'text-sm font-bold uppercase tracking-tight',
                    selectedLake.tier === 'critical' && !acknowledgedByLakeId[selectedLake.id]
                      ? 'text-error'
                      : 'text-on-surface-variant',
                  ].join(' ')}
                >
                  {acknowledgedByLakeId[selectedLake.id] && selectedLake.tier === 'critical'
                    ? 'Alert acknowledged (this session)'
                    : `Escalation level: ${selectedLake.escalationLevel} (max 4)`}
                </span>
              </div>
              <MonoValue size="md" className="!text-sm text-on-surface-variant">
                SMS: {selectedLake.smsSent} sent
              </MonoValue>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSitRepPdf}
                className="flex items-center justify-center gap-2 rounded border border-outline-variant/30 bg-surface-container-high py-3 text-xs font-bold uppercase tracking-wide transition-colors hover:bg-surface-container-highest"
                aria-label="Open situation report for print or save as PDF"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden>
                  picture_as_pdf
                </span>
                SitRep PDF
              </button>
              <button
                type="button"
                onClick={handleAcknowledge}
                disabled={
                  selectedLake.tier !== 'critical' || (selectedLake.tier === 'critical' && !!acknowledgedByLakeId[selectedLake.id])
                }
                className={[
                  'rounded py-3 text-xs font-bold uppercase tracking-wide transition-all',
                  selectedLake.tier !== 'critical' || !!acknowledgedByLakeId[selectedLake.id]
                    ? 'cursor-not-allowed bg-surface-container-high text-on-surface-variant/50'
                    : 'bg-primary text-on-primary hover:brightness-110',
                ].join(' ')}
              >
                {selectedLake.tier !== 'critical'
                  ? 'N/A'
                  : acknowledgedByLakeId[selectedLake.id]
                    ? 'Acknowledged'
                    : 'Acknowledge'}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </AppShell>
  )
}

function TelemetryRow({
  label,
  value,
  valueClass,
  pct,
  barClass,
}: {
  label: string
  value: string
  valueClass: string
  pct: number
  barClass: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-4 text-sm font-medium">
        <span className="text-on-surface-variant">{label}</span>
        <MonoValue size="md" className={`!text-base font-semibold ${valueClass}`.trim()}>
          {value}
        </MonoValue>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
        <div className={`h-full ${barClass}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  )
}
