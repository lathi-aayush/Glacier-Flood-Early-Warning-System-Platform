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
import { fetchLakeFeatures, simulateScenario, type LakeFeatureSnapshot, type SimulationResult } from '@/api/lakesApi'
import { FeatureTrendChart } from '@/components/telemetry/FeatureTrendChart'
import { ShapWaterfallChart } from '@/components/telemetry/ShapWaterfallChart'
import { ActionRecommendationCard } from '@/components/telemetry/ActionRecommendationCard'
import { InfoTooltip } from '@/components/ui'
import { useWatchlist } from '@/hooks/useWatchlist'
import { LakeItemMenu } from '@/components/dashboard/LakeItemMenu'

const DashboardMap = lazy(() =>
  import('@/components/map/DashboardMap').then((m) => ({ default: m.DashboardMap })),
)

function tierFilterMatch(lake: Lake, filter: string): boolean {
  if (filter === 'all') return true
  return lake.tier === filter
}

function formatApiTimestamp(isoStr?: string): string {
  if (!isoStr) return 'N/A'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return isoStr.replace('T', ' ').slice(0, 19)
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  } catch {
    return isoStr
  }
}

export function DashboardPage() {
  const { lakes, lakesLoading, selectedId, selectedLake, setSelectedId, syncFromRouteLakeParam } =
    useLakeSelection()
  const { pushToast } = useToast()
  const [searchParams] = useSearchParams()
  const [sidebarQuery, setSidebarQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [sidebarTab, setSidebarTab] = useState<'all' | 'watchlist'>('all')
  const { watchlistIds, watchlistCount, isInWatchlist, toggleWatchlist } = useWatchlist()
  /** Session-only: operator acknowledged the critical alert for a given lake */
  const [acknowledgedByLakeId, setAcknowledgedByLakeId] = useState<Record<string, true>>({})
  const [lakeSnapshots, setLakeSnapshots] = useState<LakeFeatureSnapshot[]>([])
  const [snapshotsLoading, setSnapshotsLoading] = useState(false)
  const [liveSimResult, setLiveSimResult] = useState<SimulationResult | null>(null)

  const handleToggleWatchlist = useCallback(
    (lake: Lake) => {
      const isNowIn = toggleWatchlist(lake.id)
      if (isNowIn) {
        pushToast({ message: `Added ${lake.name} to Watchlist`, variant: 'success' })
      } else {
        pushToast({ message: `Removed ${lake.name} from Watchlist`, variant: 'info' })
      }
    },
    [toggleWatchlist, pushToast],
  )

  useEffect(() => {
    const q = searchParams.get('lake')
    syncFromRouteLakeParam(q)
  }, [searchParams, syncFromRouteLakeParam])

  useEffect(() => {
    if (!selectedLake?.id) return
    let cancelled = false
    setSnapshotsLoading(true)
    fetchLakeFeatures(selectedLake.id, 20)
      .then((snaps) => {
        if (!cancelled) setLakeSnapshots(snaps)
      })
      .finally(() => {
        if (!cancelled) setSnapshotsLoading(false)
      })

    simulateScenario({ lake_id: selectedLake.id })
      .then((res) => {
        if (!cancelled) setLiveSimResult(res)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [selectedLake?.id])

  const sidebarLakes = useMemo(() => {
    const q = sidebarQuery.trim().toLowerCase()
    let list = lakes
    if (sidebarTab === 'watchlist') {
      list = list.filter((l) => watchlistIds.includes(l.id))
    }
    return list.filter((l) => tierFilterMatch(l, tierFilter)).filter((l) => {
      if (!q) return true
      return (
        l.name.toLowerCase().includes(q) ||
        l.basin.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q) ||
        l.nodeId.toLowerCase().includes(q)
      )
    })
  }, [lakes, sidebarQuery, tierFilter, sidebarTab, watchlistIds])

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
    <AppShell banner={banner} mainClassName="relative flex min-h-0 flex-1 h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
      <aside className="z-30 flex w-[20%] min-w-[280px] h-full flex-col overflow-hidden border-r border-outline-variant/15 bg-surface-container">
        {/* Watchlist / All Lakes Tab Switcher */}
        <div className="p-3 pb-0">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-lowest p-1">
            <button
              type="button"
              onClick={() => setSidebarTab('all')}
              className={[
                'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all',
                sidebarTab === 'all'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface',
              ].join(' ')}
            >
              <span>All Lakes</span>
              <span
                className={[
                  'rounded-full px-1.5 py-0.2 text-[10px]',
                  sidebarTab === 'all'
                    ? 'bg-on-primary/20 text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant',
                ].join(' ')}
              >
                {lakes.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('watchlist')}
              className={[
                'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all',
                sidebarTab === 'watchlist'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface',
              ].join(' ')}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={sidebarTab === 'watchlist' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                star
              </span>
              <span>Watchlist</span>
              <span
                className={[
                  'rounded-full px-1.5 py-0.2 text-[10px]',
                  watchlistCount > 0
                    ? sidebarTab === 'watchlist'
                      ? 'bg-amber-400 font-extrabold text-black'
                      : 'bg-amber-400/20 font-extrabold text-amber-300'
                    : sidebarTab === 'watchlist'
                      ? 'bg-on-primary/20 text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant',
                ].join(' ')}
              >
                {watchlistCount}
              </span>
            </button>
          </div>
        </div>

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
          ) : sidebarLakes.length === 0 ? (
            sidebarTab === 'watchlist' && watchlistCount === 0 ? (
              <div className="mx-2 my-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant/30 p-6 text-center text-on-surface-variant">
                <span className="material-symbols-outlined mb-2 text-3xl text-outline/60">
                  bookmark_border
                </span>
                <p className="font-headline text-xs font-bold text-on-surface">No lakes in watchlist</p>
                <p className="mt-1 text-[11px] leading-relaxed text-outline">
                  Click the 3 dots (<span className="font-mono">⋮</span>) on any lake card to add it to your personal watchlist.
                </p>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-on-surface-variant">
                No lakes match current filters.
              </div>
            )
          ) : (
            sidebarLakes.map((lake) => {
              const active = lake.id === selectedId
              const isWatchlisted = isInWatchlist(lake.id)
              return (
                <div
                  key={lake.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(lake.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedId(lake.id)
                    }
                  }}
                  className={[
                    'group relative w-full cursor-pointer p-3 text-left transition-all select-none',
                    active
                      ? 'border-l-4 border-error bg-surface-container-high'
                      : 'border-l-4 border-transparent hover:bg-surface-container-high/50',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-headline font-bold leading-tight text-on-surface truncate">
                          {lake.name}
                        </h3>
                        {isWatchlisted ? (
                          <span
                            className="material-symbols-outlined shrink-0 text-xs text-amber-400"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            title="In Watchlist"
                          >
                            star
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant">
                        Node ID: {lake.nodeId}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <TierBadge tier={lake.tier} />
                      <LakeItemMenu
                        lake={lake}
                        isWatchlisted={isWatchlisted}
                        onToggleWatchlist={handleToggleWatchlist}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>
      <section className="relative min-w-0 flex-1 h-full overflow-hidden bg-surface-container-lowest">
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
      <aside className="z-30 flex w-[32%] min-w-[380px] h-full flex-col overflow-y-auto bg-surface border-l border-outline-variant/15">
        <div className="space-y-6 p-5 md:p-6">
          {/* Lake Header & Metadata */}
          <div className="space-y-3">
            <h2 className="font-headline text-3xl font-extrabold tracking-tighter md:text-4xl text-on-surface">
              {selectedLake.name}
            </h2>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-outline">
              <svg
                className="h-3.5 w-3.5 text-primary/70 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>
                API updated at: <span className="text-on-surface-variant font-medium">{formatApiTimestamp(selectedLake.lastUpdated)}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <TierBadge tier={selectedLake.tier} />
              <InfoTooltip
                title="Risk Tier"
                content="Current operational hazard level evaluated by the calibrated XGBoost classification model."
              />
              {liveSimResult?.is_anomaly && (
                <span className="text-[10px] font-mono bg-amber-950/70 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>⚠️ Outlier Detected</span>
                  <InfoTooltip
                    title="Isolation Forest Outlier"
                    content="Unsupervised anomaly detector identified unusual departure from normal lake equilibrium."
                  />
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <SectionLabel className="mb-0.5 block !text-xs text-outline tracking-widest">Global Watch ID</SectionLabel>
                  <InfoTooltip
                    title="Watch ID"
                    content="Unique regional catchment identifier assigned under the National Glacial Hazard Monitoring Framework."
                  />
                </div>
                <MonoValue size="md" className="!text-sm text-on-surface-variant">
                  {selectedLake.watchId}
                </MonoValue>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <SectionLabel className="mb-0.5 block !text-xs text-outline tracking-widest">Risk Probability</SectionLabel>
                  <InfoTooltip
                    title="XGBoost Risk Score"
                    content="Calibrated 0–100 probability of glacial lake outburst flood predicted from multi-source telemetry."
                  />
                </div>
                <MonoValue size="md" className="!text-sm font-bold text-primary">
                  {selectedLake.riskScore.toFixed(1)}%
                </MonoValue>
              </div>
            </div>
          </div>

          {/* Live Diagnosis & Hazard Telemetry */}
          <div className="space-y-6">
              {/* SOP Action Recommendation Directive */}
              <ActionRecommendationCard
                sop={liveSimResult?.sop}
                tier={selectedLake.tier}
                lakeName={selectedLake.name}
              />

              {/* Live Telemetry Signals */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5">
                  <SectionLabel className="!text-xs text-primary tracking-[0.2em]">Live telemetry signals</SectionLabel>
                  <InfoTooltip
                    title="Real-Time Telemetry"
                    content="Synchronized sensor feeds fusing Open-Meteo weather, USGS earthquake catalog, and Sentinel-2 satellite passes."
                  />
                </div>
                <div className="space-y-3.5">
                  <TelemetryRow
                    label="Water level change"
                    value={`+${selectedLake.telemetry.waterLevelMPerHr}m / hr`}
                    valueClass="text-error"
                    pct={0.8}
                    barClass="bg-error"
                    tooltipTitle="Water Rise Rate"
                    tooltipContent="Calculated vertical water level rise rate in meters per hour."
                  />
                  <TelemetryRow
                    label="Seismic activity (local)"
                    value={`${selectedLake.telemetry.seismicMag} Mag`}
                    valueClass="text-secondary"
                    pct={0.33}
                    barClass="bg-secondary"
                    tooltipTitle="Local Seismicity"
                    tooltipContent="Maximum earthquake magnitude registered by USGS within a 100km radius in the past 7 days."
                  />
                  <TelemetryRow
                    label="Surface area delta"
                    value={`+${selectedLake.telemetry.areaDeltaPct}% area`}
                    valueClass="text-primary"
                    pct={0.5}
                    barClass="bg-primary"
                    tooltipTitle="Surface Area Expansion"
                    tooltipContent="Percentage change in lake water surface boundary extracted from Copernicus Sentinel-2 NDWI."
                  />
                </div>
              </div>

              {/* Historical Telemetry Feature Trend Chart */}
              <FeatureTrendChart
                snapshots={lakeSnapshots}
                lakeName={selectedLake.name}
                loading={snapshotsLoading}
              />

              {/* TreeSHAP Explainability Waterfall */}
              <ShapWaterfallChart data={liveSimResult?.waterfall} />

              {/* Legacy/Quick SHAP Feature Drivers */}
              <Card variant="inset" ghostBorder className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <SectionLabel className="!text-xs text-on-tertiary-fixed-variant tracking-widest">
                      AI decision drivers (SHAP)
                    </SectionLabel>
                    <InfoTooltip
                      title="Feature Drivers"
                      content="Attribution weights showing how each physical telemetry stream pushes risk up or down."
                    />
                  </div>
                </div>
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
                <p className="mt-2 font-mono text-xs leading-relaxed text-on-surface-variant">
                  MODEL DETERMINATION: computed via TreeSHAP on XGBoost trees calibrated against 4,065 historical GLOF triggers.
                </p>
              </Card>

              {/* Escalation Actions & SitRep */}
              <div className="space-y-4 rounded-xl border border-error/20 bg-error-container/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
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
                        'text-xs font-bold uppercase tracking-tight',
                        selectedLake.tier === 'critical' && !acknowledgedByLakeId[selectedLake.id]
                          ? 'text-error'
                          : 'text-on-surface-variant',
                      ].join(' ')}
                    >
                      {acknowledgedByLakeId[selectedLake.id] && selectedLake.tier === 'critical'
                        ? 'Alert acknowledged'
                        : `Escalation level: ${selectedLake.escalationLevel} (max 4)`}
                    </span>
                    <InfoTooltip
                      title="Escalation Protocol"
                      content="Emergency operational escalation stage (1 to 4) under NDMA standard operating procedures."
                    />
                  </div>
                  <MonoValue size="sm" className="!text-xs text-on-surface-variant">
                    SMS: {selectedLake.smsSent} sent
                  </MonoValue>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleSitRepPdf}
                    className="flex items-center justify-center gap-2 rounded border border-outline-variant/30 bg-surface-container-high py-2.5 text-xs font-bold uppercase tracking-wide transition-colors hover:bg-surface-container-highest"
                    aria-label="Open situation report for print or save as PDF"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden>
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
                      'rounded py-2.5 text-xs font-bold uppercase tracking-wide transition-all',
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
  tooltipTitle,
  tooltipContent,
}: {
  label: string
  value: string
  valueClass: string
  pct: number
  barClass: string
  tooltipTitle?: string
  tooltipContent?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-4 text-xs font-medium">
        <span className="text-on-surface-variant flex items-center gap-1.5">
          <span>{label}</span>
          {tooltipContent && <InfoTooltip title={tooltipTitle} content={tooltipContent} />}
        </span>
        <MonoValue size="md" className={`!text-sm font-semibold ${valueClass}`.trim()}>
          {value}
        </MonoValue>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
        <div className={`h-full ${barClass}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  )
}

