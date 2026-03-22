import { useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  AlertSeverityTitle,
  ChannelChip,
  DispatchStatusChip,
} from '@/components/ui/StatusChip'
import { MonoValue } from '@/components/ui/MonoValue'
import { useAlertsQuery } from '@/hooks/useAlertsQuery'
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
  const { alerts, loading, source } = useAlertsQuery()
  const [lakeFilter, setLakeFilter] = useState('')

  const filtered = useMemo(() => {
    const q = lakeFilter.trim().toLowerCase()
    if (!q) return alerts
    return alerts.filter((a) => a.lakeId.toLowerCase().includes(q) || a.lakeName.toLowerCase().includes(q))
  }, [alerts, lakeFilter])

  const totalDispatched = useMemo(() => alerts.reduce((s, a) => s + a.smsCount, 0), [alerts])
  const pendingAck = useMemo(() => alerts.filter((a) => a.status === 'pending').length, [alerts])

  return (
    <AppShell mainClassName="relative min-h-0 flex-1 overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 bg-grid" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl p-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-2xl">
            <h1 className="mb-4 font-headline text-5xl font-bold leading-none tracking-tighter text-on-surface">
              Alert <span className="text-primary">log</span>
            </h1>
            <p className="text-lg font-light leading-relaxed text-on-surface-variant">
              Dispatch history from <code className="font-mono text-sm text-primary">GET /alerts</code> when the API is
              configured; otherwise the bundled demo log.
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-outline">Source: {loading ? 'loading…' : source === 'api' ? 'API' : 'demo'}</p>
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
          <div className="flex flex-wrap items-center gap-6">
            <button type="button" className="border-b border-primary pb-1 font-label text-xs uppercase tracking-widest text-primary">
              Historical
            </button>
            <button type="button" className="pb-1 font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-on-surface">
              Real-time stream
            </button>
            <button type="button" className="pb-1 font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-on-surface">
              Reports
            </button>
          </div>
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
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3" role="status" aria-label="Loading alerts">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-md" label="" />
              ))}
            </div>
          ) : (
            filtered.map((a) => (
              <div key={a.id} className="group">
                <div className="flex cursor-pointer items-center gap-4 bg-surface-container p-4 transition-all group-hover:bg-surface-container-high">
                  <div className={`h-12 w-1.5 ${severityStripe(a.severity)}`} aria-hidden />
                  <div className="grid flex-1 grid-cols-12 items-center gap-4">
                    <div className="col-span-12 sm:col-span-2">
                      <MonoValue size="sm" className="text-on-surface-variant">
                        {a.ts.replace('T', ' ').slice(0, 19)}
                      </MonoValue>
                      <AlertSeverityTitle severity={a.severity} />
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                      <p className="font-label text-xs uppercase tracking-tighter text-on-surface-variant">Lake source</p>
                      <p className="font-headline text-base font-medium">{a.lakeName}</p>
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <p className="font-label text-xs uppercase tracking-tighter text-on-surface-variant">SMS count</p>
                      <MonoValue size="md" className="text-on-surface">
                        {a.smsCount.toLocaleString()}
                      </MonoValue>
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                      <div className="flex flex-wrap gap-1">
                        {a.channels.map((c) => (
                          <ChannelChip key={c} label={c} />
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12 flex items-center justify-end gap-3 sm:col-span-2">
                      <DispatchStatusChip status={a.status} />
                      <span className="material-symbols-outlined text-on-surface-variant transition-colors group-hover:text-primary" aria-hidden>
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
