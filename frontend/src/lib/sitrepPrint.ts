import type { Lake } from '@/types/lake'
import { printHtmlDocument, type HtmlExportResult } from '@/lib/printHtmlDocument'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildSitRepHtml(lake: Lake): string {
  const generated = new Date().toISOString()
  const shapRows = lake.shap
    .map((r) => `<tr><td>${esc(r.feature)}</td><td>${r.direction === 'up' ? '+' : ''}${r.value.toFixed(3)}</td></tr>`)
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(`GlacierGuard SitRep — ${lake.name}`)}</title>
  <style>
    body { font-family: system-ui, Segoe UI, sans-serif; margin: 24px; color: #111; line-height: 1.45; }
    h1 { font-size: 1.25rem; margin: 0 0 4px; }
    .meta { color: #444; font-size: 0.85rem; margin-bottom: 20px; }
    h2 { font-size: 0.95rem; margin: 18px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
    .disclaimer { margin-top: 24px; font-size: 0.75rem; color: #555; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>GlacierGuard — Situation report</h1>
  <p class="meta">Generated: ${esc(generated)} · Watch ID: ${esc(lake.watchId)} · Node: ${esc(lake.nodeId)}</p>

  <h2>Lake</h2>
  <table>
    <tr><th>Name</th><td>${esc(lake.name)}</td></tr>
    <tr><th>Status tier</th><td>${esc(lake.tier.toUpperCase())}</td></tr>
    <tr><th>State / basin</th><td>${esc(lake.state)} / ${esc(lake.basin)}</td></tr>
    <tr><th>Coordinates</th><td>${lake.lat.toFixed(4)}° N, ${lake.lng.toFixed(4)}° E</td></tr>
    <tr><th>Last updated (demo)</th><td>${esc(lake.lastUpdated)}</td></tr>
  </table>

  <h2>Telemetry (indicative)</h2>
  <table>
    <tr><th>Water level change</th><td>+${lake.telemetry.waterLevelMPerHr} m/hr</td></tr>
    <tr><th>Seismic (local)</th><td>${lake.telemetry.seismicMag} Mag</td></tr>
    <tr><th>Surface area delta</th><td>+${lake.telemetry.areaDeltaPct}%</td></tr>
  </table>

  <h2>Model drivers (SHAP-style)</h2>
  <table><thead><tr><th>Feature</th><th>Contribution</th></tr></thead><tbody>${shapRows}</tbody></table>

  <h2>Comms</h2>
  <table>
    <tr><th>Escalation level</th><td>${lake.escalationLevel} (max 4)</td></tr>
    <tr><th>SMS dispatched</th><td>${lake.smsSent}</td></tr>
  </table>

  <p class="disclaimer">
    Demo / screening output only — not operational hazard guidance. Verify all fields against authoritative sources before action.
  </p>
</body>
</html>`
  return html
}

/** Print / save-as-PDF via hidden iframe (no pop-up). May download HTML as fallback. */
export function openSitRepPrintWindow(lake: Lake): Promise<HtmlExportResult> {
  return printHtmlDocument(buildSitRepHtml(lake), {
    fallbackFilename: `glacierguard-sitrep-${lake.id}.html`,
  })
}
