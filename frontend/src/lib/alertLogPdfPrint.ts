import type { AlertEntry } from '@/types/alert'
import { printHtmlDocument, type HtmlExportResult } from '@/lib/printHtmlDocument'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type AlertLogPrintMeta = {
  dataSourceLabel: string
  lakeFilter: string
}

function buildAlertLogHtml(alerts: AlertEntry[], meta: AlertLogPrintMeta): string {
  const generated = new Date().toISOString()
  const rows = alerts
    .map(
      (a) => `<tr>
    <td>${esc(a.ts.replace('T', ' ').slice(0, 19))}</td>
    <td>${esc(a.severity.toUpperCase())}</td>
    <td>${esc(a.lakeName)}</td>
    <td>${esc(a.lakeId)}</td>
    <td class="num">${a.smsCount.toLocaleString()}</td>
    <td>${esc(a.status.toUpperCase())}</td>
    <td>${esc(a.channels.join(', '))}</td>
  </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc('GlacierGuard — Alert reports')}</title>
  <style>
    body { font-family: system-ui, Segoe UI, sans-serif; margin: 24px; color: #111; line-height: 1.4; }
    h1 { font-size: 1.2rem; margin: 0 0 4px; }
    .meta { color: #444; font-size: 0.8rem; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.72rem; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
    th { background: #f0f0f0; font-weight: 600; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .disclaimer { margin-top: 18px; font-size: 0.7rem; color: #555; }
    @media print { body { margin: 10mm; } thead { display: table-header-group; } tr { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>GlacierGuard — Alert dispatch reports</h1>
  <p class="meta">Generated: ${esc(generated)} · Source: ${esc(meta.dataSourceLabel)} · Rows: ${alerts.length}
    ${meta.lakeFilter.trim() ? `· Filter: ${esc(meta.lakeFilter.trim())}` : ''}</p>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Severity</th>
        <th>Lake</th>
        <th>Lake ID</th>
        <th>SMS count</th>
        <th>Status</th>
        <th>Channels</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="disclaimer">Demo or screening data where applicable — verify against operational systems.</p>
</body>
</html>`
}

export function openAlertLogPrintWindow(alerts: AlertEntry[], meta: AlertLogPrintMeta): Promise<HtmlExportResult> {
  return printHtmlDocument(buildAlertLogHtml(alerts, meta), {
    fallbackFilename: 'glacierguard-alert-reports.html',
  })
}
