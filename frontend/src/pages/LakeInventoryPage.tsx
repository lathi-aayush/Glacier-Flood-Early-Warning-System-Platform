import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { InventoryRiskChip } from '@/components/ui/StatusChip'
import { Skeleton } from '@/components/ui/Skeleton'
import { useLakeSelection } from '@/hooks/useLakeSelection'
import type { Lake } from '@/types/lake'

function tierSort(a: Lake, b: Lake) {
  return b.riskScore - a.riskScore
}

export function LakeInventoryPage() {
  const navigate = useNavigate()
  const { lakes, lakesLoading, dataSource } = useLakeSelection()
  const [query, setQuery] = useState('')
  const [basin, setBasin] = useState<string>('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = [...lakes].sort(tierSort)
    if (basin !== 'all') {
      list = list.filter((l) => l.basin.toLowerCase().includes(basin.toLowerCase()))
    }
    if (q) {
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.basin.toLowerCase().includes(q),
      )
    }
    return list
  }, [lakes, query, basin])

  return (
    <AppShell mainClassName="min-h-0 flex-1 overflow-y-auto pt-0">
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1600px] p-6 md:p-8">
          <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="mb-2 font-headline text-3xl font-bold tracking-tight text-primary">
                High-risk lake inventory
              </h1>
              <p className="max-w-2xl text-on-surface-variant">
                Lake list from the API when <code className="font-mono text-primary">VITE_API_BASE_URL</code> is set;
                otherwise demo data. Sorted by current risk score.
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-outline">
                Source: {lakesLoading ? 'loading…' : dataSource === 'api' ? 'API' : 'demo'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">
                  search
                </span>
                <input
                  className="w-64 rounded-md border-none bg-surface-container-lowest py-2.5 pl-10 pr-4 text-sm text-on-surface transition-all focus:ring-1 focus:ring-primary"
                  placeholder="Search by basin, ID or name…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                />
              </div>
              <select
                className="rounded-md border border-outline-variant/15 bg-surface-container-lowest px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                value={basin}
                onChange={(e) => setBasin(e.target.value)}
              >
                <option value="all">All basins</option>
                <option value="teesta">Teesta</option>
                <option value="koshi">Koshi</option>
                <option value="sutlej">Sutlej</option>
                <option value="chenab">Chenab</option>
              </select>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md bg-surface-container-high px-4 py-2.5 text-sm font-medium text-on-surface transition-all hover:bg-surface-bright"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden>
                  download
                </span>
                Export to CSV
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition-all hover:brightness-110 active:scale-95"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
                  picture_as_pdf
                </span>
                Export PDF
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-high/50">
                    <th className="px-6 py-4">
                      <input className="h-4 w-4 rounded border-outline-variant bg-surface-container-lowest" type="checkbox" aria-label="Select all" />
                    </th>
                    <th className="px-4 py-4 font-label text-xs font-bold uppercase tracking-wider text-primary-container">
                      Lake ID
                    </th>
                    <th className="px-4 py-4 font-label text-xs font-bold uppercase tracking-wider text-primary-container">Name</th>
                    <th className="px-4 py-4 font-label text-xs font-bold uppercase tracking-wider text-primary-container">Basin</th>
                    <th className="px-4 py-4 text-center font-label text-xs font-bold uppercase tracking-wider text-primary-container">
                      Current risk score
                    </th>
                    <th className="px-4 py-4 font-label text-xs font-bold uppercase tracking-wider text-primary-container">
                      Vulnerable pop.
                    </th>
                    <th className="px-4 py-4 font-label text-xs font-bold uppercase tracking-wider text-primary-container">
                      Last updated
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {lakesLoading ? (
                    <tr>
                      <td colSpan={8} className="p-6">
                        <div className="space-y-3" role="status" aria-label="Loading inventory">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" label="" />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((lake) => (
                      <tr key={lake.id} className="group transition-colors hover:bg-surface-container-high">
                        <td className="px-6 py-4">
                          <input className="h-4 w-4 rounded border-outline-variant bg-surface-container-lowest" type="checkbox" aria-label={`Select ${lake.name}`} />
                        </td>
                        <td className="px-4 py-4 font-mono text-sm text-secondary">{lake.id}</td>
                        <td className="px-4 py-4 font-medium text-on-surface">{lake.name}</td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{lake.basin}</td>
                        <td className="px-4 py-4 text-center">
                          <InventoryRiskChip tier={lake.tier} score={lake.riskScore} />
                        </td>
                        <td className="px-4 py-4 font-mono text-sm text-on-surface-variant">
                          {lake.vulnerablePop.toLocaleString()} souls
                        </td>
                        <td className="px-4 py-4 font-mono text-[11px] uppercase tracking-tight text-outline">
                          {lake.lastUpdated.replace('T', ' ').slice(0, 16)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/?lake=${encodeURIComponent(lake.id)}`)}
                            className="text-outline transition-colors hover:text-primary"
                            aria-label={`Open dashboard for ${lake.name}`}
                          >
                            <span className="material-symbols-outlined text-xl" aria-hidden>
                              monitoring
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-outline-variant/15 bg-surface-container-highest/20 px-6 py-4">
              <div className="flex items-center gap-8 font-mono text-[11px] uppercase tracking-wider text-outline">
                <span>
                  Showing {lakesLoading ? '—' : rows.length} of {lakes.length} lakes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
