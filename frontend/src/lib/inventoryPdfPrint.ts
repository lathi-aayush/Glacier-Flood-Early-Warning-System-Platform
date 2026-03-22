import type { Lake } from '@/types/lake'
import { printHtmlDocument, type HtmlExportResult } from '@/lib/printHtmlDocument'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type InventoryPrintMeta = {
  dataSourceLabel: string
  basinFilter: string
  searchQuery: string
}

function buildLakeInventoryHtml(lakes: Lake[], meta: InventoryPrintMeta): string {
  const generated = new Date().toISOString()
  const bodyRows = lakes
    .map(
      (lake) => `<tr>
    <td>${esc(lake.id)}</td>
    <td>${esc(lake.name)}</td>
    <td>${esc(lake.basin)}</td>
    <td>${esc(lake.state)}</td>
    <td>${esc(lake.tier.toUpperCase())}</td>
    <td class="num">${lake.riskScore.toFixed(1)}</td>
    <td class="num">${lake.vulnerablePop.toLocaleString()}</td>
    <td>${esc(lake.lastUpdated.replace('T', ' ').slice(0, 16))}</td>
  </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc('GlacierGuard — Lake inventory')}</title>
  <style>
    body { font-family: system-ui, Segoe UI, sans-serif; margin: 24px; color: #111; line-height: 1.4; }
    h1 { font-size: 1.25rem; margin: 0 0 4px; }
    .meta { color: #444; font-size: 0.8rem; margin-bottom: 6px; }
    .filters { color: #555; font-size: 0.75rem; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.72rem; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
    th { background: #f0f0f0; font-weight: 600; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .disclaimer { margin-top: 20px; font-size: 0.7rem; color: #555; }
    @media print { body { margin: 10mm; } thead { display: table-header-group; } tr { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>GlacierGuard — High-risk lake inventory</h1>
  <p class="meta">Generated: ${esc(generated)} · Data source: ${esc(meta.dataSourceLabel)} · Rows: ${lakes.length}</p>
  <p class="filters">Basin filter: ${esc(meta.basinFilter)} · Search: ${meta.searchQuery.trim() ? esc(meta.searchQuery.trim()) : '(none)'}</p>
  <table>
    <thead>
      <tr>
        <th>Lake ID</th>
        <th>Name</th>
        <th>Basin</th>
        <th>State</th>
        <th>Tier</th>
        <th>Risk score</th>
        <th>Vulnerable pop.</th>
        <th>Last updated</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <p class="disclaimer">
    Screening / demo data where applicable — not operational hazard guidance. Verify against authoritative sources.
  </p>
</body>
</html>`
  return html
}

export function openLakeInventoryPrintWindow(lakes: Lake[], meta: InventoryPrintMeta): Promise<HtmlExportResult> {
  return printHtmlDocument(buildLakeInventoryHtml(lakes, meta), {
    fallbackFilename: 'glacierguard-lake-inventory.html',
  })
}
