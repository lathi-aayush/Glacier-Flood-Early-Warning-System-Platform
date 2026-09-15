import type { Lake } from '@/types/lake'
import type { AlertEntry } from '@/types/alert'

/**
 * Escapes and sanitizes a cell value for standard CSV compatibility.
 * Prevents CSV formula injection and handles quotes/commas.
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  const str = String(value)
  // If the cell contains quotes, commas, or newlines, enclose in quotes and double internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  // Neutralize CSV formula injection characters if present at start
  if (/^[=+\-@\t\r]/.test(str)) {
    return `"'${str}"`
  }
  return str
}

/**
 * Triggers a browser download of a CSV file.
 */
function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function getTimestamp(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Exports an array of Lake entities to a formatted CSV file.
 */
export function exportLakesToCsv(lakes: Lake[], customFilename?: string): void {
  const headers = [
    'Watch ID',
    'Lake Name',
    'Basin',
    'State / Region',
    'Latitude',
    'Longitude',
    'Risk Tier',
    'Risk Probability (%)',
    'Vulnerable Population',
    'Water Rise Rate (m/hr)',
    'Seismic Mag (7d)',
    'Surface Area Delta (%)',
    'SMS Sent',
    'Last Synchronized',
  ]

  const rows = lakes.map((lake) => [
    escapeCsvCell(lake.watchId),
    escapeCsvCell(lake.name),
    escapeCsvCell(lake.basin),
    escapeCsvCell(lake.state),
    escapeCsvCell(lake.lat),
    escapeCsvCell(lake.lng),
    escapeCsvCell(lake.tier.toUpperCase()),
    escapeCsvCell(lake.riskScore.toFixed(1)),
    escapeCsvCell(lake.vulnerablePop),
    escapeCsvCell(lake.telemetry.waterLevelMPerHr.toFixed(2)),
    escapeCsvCell(lake.telemetry.seismicMag.toFixed(1)),
    escapeCsvCell(lake.telemetry.areaDeltaPct.toFixed(1)),
    escapeCsvCell(lake.smsSent),
    escapeCsvCell(lake.lastUpdated),
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const filename = customFilename || `glacierguard_lake_inventory_${getTimestamp()}.csv`
  downloadCsv(csvContent, filename)
}

/**
 * Exports an array of AlertEntry items to a formatted CSV file.
 */
export function exportAlertsToCsv(alerts: AlertEntry[], customFilename?: string): void {
  const headers = [
    'Alert ID',
    'Timestamp',
    'Severity Tier',
    'Lake Name',
    'Lake Watch ID',
    'SMS Dispatched',
    'Disaster Notification Channels',
    'Acknowledgement Status',
  ]

  const rows = alerts.map((alert) => [
    escapeCsvCell(alert.id),
    escapeCsvCell(alert.ts),
    escapeCsvCell(alert.severity.toUpperCase()),
    escapeCsvCell(alert.lakeName),
    escapeCsvCell(alert.lakeId),
    escapeCsvCell(alert.smsCount),
    escapeCsvCell(alert.channels.join('; ')),
    escapeCsvCell(alert.status === 'ack' ? 'Acknowledged' : 'Pending Action'),
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const filename = customFilename || `glacierguard_alert_audit_${getTimestamp()}.csv`
  downloadCsv(csvContent, filename)
}
