import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { MonoValue } from '@/components/ui/MonoValue'
import { RiskTierChip } from '@/components/ui/StatusChip'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Skeleton } from '@/components/ui/Skeleton'
import { useLakeSelection } from '@/hooks/useLakeSelection'
import type { Lake } from '@/types/lake'

const DashboardMap = lazy(() =>
  import('@/components/map/DashboardMap').then((m) => ({ default: m.DashboardMap })),
)

function tierFilterMatch(lake: Lake, filter: string): boolean {
  if (filter === 'all') return true
  return lake.tier === filter
}

function scoreArc(score: number) {
  const c = 2 * Math.PI * 34
  const pct = Math.min(100, Math.max(0, score)) / 100
  return { c, offset: c * (1 - pct) }
}

export function DashboardPage() {
  const { lakes, lakesLoading, dataSource, selectedId, selectedLake, setSelectedId, syncFromRouteLakeParam } =
    useLakeSelection()
  const [searchParams] = useSearchParams()
  const [sidebarQuery, setSidebarQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')

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

  const arc = scoreArc(selectedLake.riskScore)

  const banner =
    selectedLake.tier === 'critical' ? (
      <div className="flex w-full shrink-0 animate-pulse items-center justify-between border-b border-error/30 bg-error-container/20 px-6 py-2 text-error">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined font-bold">warning</span>
          <span className="font-headline font-bold tracking-tight">
            CRITICAL ALERT — {selectedLake.name} — Risk Score: {Math.round(selectedLake.riskScore)} — SMS
            dispatched to {selectedLake.smsSent} contacts — 6h window active
          </span>
        </div>
        <button
          type="button"
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
          ) : (
            <p className="text-[10px] uppercase tracking-widest text-outline">
              Data: {dataSource === 'api' ? 'API' : 'demo'}
            </p>
          )}
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
                    <RiskTierChip tier={lake.tier} score={lake.riskScore} />
                  </div>
                  <div className="flex h-8 items-end gap-[2px]">
                    <div className="relative h-2 w-full flex-grow overflow-hidden rounded-full bg-error/10">
                      <div
                        className="absolute inset-0 bg-error"
                        style={{ width: `${Math.min(100, lake.riskScore)}%` }}
                      />
                    </div>
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
        <div className="pointer-events-none absolute left-4 right-4 top-4 flex justify-between">
          <div className="pointer-events-auto flex gap-1 rounded-lg border border-outline-variant/10 bg-surface-container-high/80 p-1 backdrop-blur-md">
            {['Lakes', 'Flood Paths', 'Villages', 'Rainfall Overlay'].map((label, i) => (
              <button
                key={label}
                type="button"
                className={[
                  'rounded px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest',
                  i === 0 ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="pointer-events-auto rounded-lg border border-outline-variant/10 bg-surface-container-high/80 p-3 backdrop-blur-md">
            <SectionLabel className="mb-2 tracking-tighter text-outline">Coordinates</SectionLabel>
            <MonoValue size="md" className="text-primary">
              {selectedLake.lat.toFixed(4)}° N, {selectedLake.lng.toFixed(4)}° E
            </MonoValue>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-6 left-6 max-w-xs rounded-xl border border-outline-variant/20 bg-surface-container-high/90 p-4 backdrop-blur-md">
          <SectionLabel as="h3" className="mb-3 text-primary tracking-widest">
            Downstream impact model
          </SectionLabel>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-2 w-12 rounded-full bg-gradient-to-r from-error to-error/20" />
              <span className="text-[10px] font-medium text-on-surface-variant">HIGH VELOCITY INUNDATION</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-12 rounded-full bg-gradient-to-r from-primary to-primary/20" />
              <span className="text-[10px] font-medium text-on-surface-variant">SECONDARY SATURATION ZONE</span>
            </div>
          </div>
        </div>
      </section>
      <aside className="z-40 flex w-[30%] min-w-[380px] flex-col overflow-y-auto bg-surface">
        <div className="space-y-6 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="font-headline text-2xl font-extrabold tracking-tighter">{selectedLake.name}</h2>
              <div>
                <SectionLabel className="mb-0.5 block text-outline tracking-widest">Global Watch ID</SectionLabel>
                <MonoValue size="sm" className="text-on-surface-variant">
                  {selectedLake.watchId}
                </MonoValue>
              </div>
            </div>
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                <circle className="text-surface-container-high" cx="40" cy="40" r="34" fill="transparent" stroke="currentColor" strokeWidth="6" />
                <circle
                  className="text-error"
                  cx="40"
                  cy="40"
                  r="34"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={arc.c}
                  strokeDashoffset={arc.offset}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-headline text-2xl font-bold leading-none">{Math.round(selectedLake.riskScore)}</span>
                <span className="text-[8px] font-bold uppercase text-error">Score</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border-b border-error/50 bg-surface-container-lowest p-3">
              <div className="mb-1 text-[9px] font-bold uppercase text-outline">72h Pred</div>
              <div className="font-headline text-lg font-bold text-secondary">{selectedLake.predictions.h72}</div>
            </div>
            <div className="rounded-lg border-b border-error/70 bg-surface-container-lowest p-3">
              <div className="mb-1 text-[9px] font-bold uppercase text-outline">24h Pred</div>
              <div className="font-headline text-lg font-bold text-error">{selectedLake.predictions.h24}</div>
            </div>
            <div className="rounded-lg border-b-2 border-error bg-surface-container-lowest p-3">
              <div className="mb-1 text-[9px] font-bold uppercase text-outline">6h Pred</div>
              <div className="font-headline text-lg font-bold text-error">{selectedLake.predictions.h6}</div>
            </div>
          </div>
          <div className="space-y-4">
            <SectionLabel className="text-primary tracking-[0.2em]">Live telemetry signals</SectionLabel>
            <div className="space-y-3">
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
          <Card variant="inset" ghostBorder className="space-y-3 p-4">
            <SectionLabel className="text-on-tertiary-fixed-variant tracking-widest">
              AI decision rationale (SHAP)
            </SectionLabel>
            <div className="space-y-2">
              {selectedLake.shap.map((row) => (
                <div key={row.feature} className="flex items-center gap-2">
                  <span className="w-16 font-mono text-[10px] text-outline">{row.feature}</span>
                  <div className="flex flex-grow items-center">
                    <div
                      className={[
                        'h-3 rounded-sm',
                        row.direction === 'up' ? 'rounded-r-sm bg-error' : 'rounded-l-sm bg-secondary',
                      ].join(' ')}
                      style={{ width: `${Math.min(100, Math.abs(row.value) * 400)}%` }}
                    />
                  </div>
                  <span
                    className={[
                      'font-mono text-[10px]',
                      row.direction === 'up' ? 'text-error' : 'text-secondary',
                    ].join(' ')}
                  >
                    {row.direction === 'up' ? '+' : ''}
                    {row.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <MonoValue size="sm" className="mt-3 block leading-relaxed text-on-surface-variant">
              MODEL DETERMINATION: screening score driven by precipitation windows, thermal context, and lake-area
              deltas — indicative only; not operational hazard guidance.
            </MonoValue>
          </Card>
          <div className="space-y-3">
            <SectionLabel className="text-primary tracking-widest">Flood impact projection</SectionLabel>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-outline-variant/20 text-[9px] uppercase text-outline">
                  <th className="py-2 text-left font-bold">Time band</th>
                  <th className="py-2 text-left font-bold">Village</th>
                  <th className="py-2 text-right font-bold">Pop. at risk</th>
                </tr>
              </thead>
              <tbody className="font-mono text-on-surface-variant">
                {selectedLake.floodProjection.map((row) => (
                  <tr key={row.village + row.timeBand} className="border-b border-outline-variant/10">
                    <td
                      className={[
                        'py-2 font-bold',
                        row.urgency === 'critical'
                          ? 'text-error'
                          : row.urgency === 'elevated'
                            ? 'text-secondary'
                            : 'text-on-surface-variant',
                      ].join(' ')}
                    >
                      {row.timeBand}
                    </td>
                    <td className="py-2">{row.village}</td>
                    <td className="py-2 text-right">{row.popAtRisk.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-4 rounded-xl border border-error/20 bg-error-container/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-error" />
                <span className="text-[11px] font-bold uppercase text-error">
                  Escalation level: {selectedLake.escalationLevel} (max 4)
                </span>
              </div>
              <MonoValue size="sm" className="text-on-surface-variant">
                SMS: {selectedLake.smsSent} sent
              </MonoValue>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded border border-outline-variant/30 bg-surface-container-high py-2 text-[10px] font-bold uppercase transition-colors hover:bg-surface-container-highest"
                aria-label="Export situation report PDF"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden>
                  picture_as_pdf
                </span>
                SitRep PDF
              </button>
              <button
                type="button"
                className="rounded bg-primary py-2 text-[10px] font-bold uppercase text-on-primary transition-all hover:brightness-110"
              >
                Acknowledge
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
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] font-medium">
        <span className="text-on-surface-variant">{label}</span>
        <MonoValue className={valueClass}>{value}</MonoValue>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-container-high">
        <div className={`h-full ${barClass}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  )
}
