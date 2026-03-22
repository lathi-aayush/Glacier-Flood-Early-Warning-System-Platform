import { useCallback, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Skeleton } from '@/components/ui/Skeleton'
import { AlertSeverityTitle, DispatchStatusChip } from '@/components/ui/StatusChip'
import { MonoValue } from '@/components/ui/MonoValue'
import { useAlertsQuery } from '@/hooks/useAlertsQuery'
import { useToast } from '@/hooks/useToast'
import { openAlertLogPrintWindow } from '@/lib/alertLogPdfPrint'
import type { AlertEntry } from '@/types/alert'

function severityStripe(sev: AlertEntry['severity']) {
  switch (sev) {
    case 'critical':
      return 'bg-error'
    case 'high':
      return 'bg-primary'
    default:
      return 'bg-secondary-container'
  }
}

export function AlertLogPage() {
  const { pushToast } = useToast()
  const { alerts, loading, source } = useAlertsQuery()
  const [lakeFilter, setLakeFilter] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  const filtered = useMemo(() => {
    const q = lakeFilter.trim().toLowerCase()
    if (!q) return alerts
    return alerts.filter((a) => a.lakeId.toLowerCase().includes(q) || a.lakeName.toLowerCase().includes(q))
  }, [alerts, lakeFilter])

  const totalDispatched = useMemo(() => alerts.reduce((s, a) => s + a.smsCount, 0), [alerts])
  const pendingAck = useMemo(() => alerts.filter((a) => a.status === 'pending').length, [alerts])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleExportPdf = useCallback(async () => {
    if (loading) {
      pushToast({ message: 'Wait for alerts to finish loading.', variant: 'info' })
      return
    }
    if (filtered.length === 0) {
      pushToast({ message: 'No alerts match the current filter — nothing to export.', variant: 'warning' })
      return
    }
    try {
      const result = await openAlertLogPrintWindow(filtered, {
        dataSourceLabel: source === 'api' ? 'API' : 'demo',
        lakeFilter,
      })
      if (result === 'failed') {
        pushToast({
          message: 'Could not export. Try another browser or check download permissions.',
          variant: 'error',
        })
        return
      }
      if (result === 'download') {
        pushToast({
          message: 'Saved report as an HTML file. Open it and use Print → Save as PDF.',
          variant: 'info',
        })
        return
      }
      pushToast({
        message: 'Print dialog opened — choose Save as PDF or a printer.',
        variant: 'info',
      })
    } catch {
      pushToast({ message: 'Export failed.', variant: 'error' })
    }
  }, [filtered, lakeFilter, loading, pushToast, source])

  return (
    <AppShell mainClassName="relative min-h-0 flex-1 overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 bg-grid" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl p-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-2xl">
            <h1 className="mb-4 font-headline text-5xl font-bold leading-none tracking-tighter text-on-surface">
              Alert <span className="text-primary">log</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <Card variant="panel" className="min-w-[160px] border-l-2 border-l-primary-container p-4">
              <SectionLabel className="mb-1 text-on-surface-variant tracking-widest">Total dispatched</SectionLabel>
              <p className="font-headline text-3xl font-bold text-primary">{loading ? '—' : totalDispatched.toLocaleString()}</p>
            </Card>
            <Card variant="panel" className="min-w-[160px] border-l-2 border-l-error p-4">
              <SectionLabel className="mb-1 text-on-surface-variant tracking-widest">Pending ack</SectionLabel>
              <p className="font-headline text-3xl font-bold text-error">{loading ? '—' : String(pendingAck).padStart(2, '0')}</p>
            </Card>
          </div>
        </div>
        <div className="mb-6 flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-label text-xs uppercase tracking-[0.2em] text-primary">Reports</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">search</span>
              <input
                className="w-64 rounded border-none bg-surface-container-lowest py-2 pl-10 pr-4 font-mono text-xs text-on-surface focus:ring-1 focus:ring-primary-container"
                placeholder="FILTER BY LAKE_ID…"
                value={lakeFilter}
                onChange={(e) => setLakeFilter(e.target.value)}
                aria-label="Filter alerts by lake id or name"
              />
            </div>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={loading}
              className={[
                'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-primary transition-all hover:brightness-110',
                loading ? 'cursor-not-allowed opacity-60' : '',
              ].join(' ')}
              aria-label="Export filtered reports to PDF via print dialog"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
                picture_as_pdf
              </span>
              Export PDF
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3" role="status" aria-label="Loading alerts">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-md" label="" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="rounded-xl border border-outline-variant/10 bg-surface-container px-6 py-8 text-center text-on-surface-variant">
              No alerts match this filter.
            </p>
          ) : (
            filtered.map((a) => {
              const expanded = expandedIds.has(a.id)
              const panelId = `alert-detail-${a.id}`
              return (
                <div
                  key={a.id}
                  className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(a.id)}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    className="group flex w-full cursor-pointer items-center gap-4 p-4 text-left transition-all hover:bg-surface-container-high"
                  >
                    <div className={`h-12 w-1.5 shrink-0 ${severityStripe(a.severity)}`} aria-hidden />
                    <div className="grid min-w-0 flex-1 grid-cols-12 items-center gap-4">
                      <div className="col-span-12 sm:col-span-3">
                        <MonoValue size="sm" className="text-on-surface-variant">
                          {a.ts.replace('T', ' ').slice(0, 19)}
                        </MonoValue>
                        <AlertSeverityTitle severity={a.severity} />
                      </div>
                      <div className="col-span-12 sm:col-span-4">
                        <p className="font-label text-xs uppercase tracking-tighter text-on-surface-variant">Lake source</p>
                        <p className="font-headline text-base font-medium">{a.lakeName}</p>
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <p className="font-label text-xs uppercase tracking-tighter text-on-surface-variant">SMS count</p>
                        <MonoValue size="md" className="text-on-surface">
                          {a.smsCount.toLocaleString()}
                        </MonoValue>
                      </div>
                      <div className="col-span-6 flex items-center justify-end gap-3 sm:col-span-2">
                        <DispatchStatusChip status={a.status} />
                        <span
                          className={[
                            'material-symbols-outlined shrink-0 text-on-surface-variant transition-transform duration-200 group-hover:text-primary',
                            expanded ? 'rotate-180' : '',
                          ].join(' ')}
                          aria-hidden
                        >
                          expand_more
                        </span>
                      </div>
                    </div>
                  </button>
                  {expanded ? (
                    <div
                      id={panelId}
                      role="region"
                      aria-label={`Details for alert ${a.id}`}
                      className="border-t border-outline-variant/15 bg-surface-container-lowest/80 px-4 py-4 pl-6 sm:pl-10"
                    >
                      <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="font-label text-[10px] uppercase tracking-wider text-outline">Alert ID</dt>
                          <dd className="mt-0.5 font-mono text-on-surface">{a.id}</dd>
                        </div>
                        <div>
                          <dt className="font-label text-[10px] uppercase tracking-wider text-outline">Lake ID</dt>
                          <dd className="mt-0.5 font-mono text-on-surface">{a.lakeId}</dd>
                        </div>
                        <div>
                          <dt className="font-label text-[10px] uppercase tracking-wider text-outline">Dispatch channels</dt>
                          <dd className="mt-0.5 text-on-surface-variant">
                            {a.channels.length > 0 ? a.channels.join(', ') : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-label text-[10px] uppercase tracking-wider text-outline">Full timestamp</dt>
                          <dd className="mt-0.5 font-mono text-xs text-on-surface-variant">{a.ts}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </div>
    </AppShell>
  )
}
