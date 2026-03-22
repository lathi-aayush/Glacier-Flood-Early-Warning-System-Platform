/** Mock replay: normalized time 0–1 with derived telemetry for UI sync */

export type ReplayEventMeta = {
  id: string
  label: string
  startLabel: string
  lakeLat: number
  lakeLng: number
  durationLabel: string
}

export const REPLAY_EVENTS: ReplayEventMeta[] = [
  {
    id: 'sikkim-2023',
    label: 'Sikkim Oct 2023',
    startLabel: '04 OCT 2023',
    lakeLat: 27.7725,
    lakeLng: 88.583,
    durationLabel: '14h 22m',
  },
  {
    id: 'chamoli-2021',
    label: 'Chamoli Feb 2021',
    startLabel: '07 FEB 2021',
    lakeLat: 30.35,
    lakeLng: 79.62,
    durationLabel: '09h 10m',
  },
  {
    id: 'kedarnath-2013',
    label: 'Kedarnath June 2013',
    startLabel: '16 JUN 2013',
    lakeLat: 30.73,
    lakeLng: 79.07,
    durationLabel: '36h+',
  },
]

/** Risk score 0–100 and path opacity 0–1 along timeline */
export function replaySampleAt(t: number): {
  risk: number
  riskLabel: string
  pathOpacity: number
  discharge: number
  clock: string
} {
  const u = Math.min(1, Math.max(0, t))
  // Piecewise mock: ramp-up breach, peak, recession
  const risk =
    u < 0.2
      ? 20 + u * 150
      : u < 0.55
        ? 50 + (u - 0.2) * 120
        : 86 - (u - 0.55) * 40
  const pathOpacity = u < 0.15 ? u / 0.15 : Math.max(0.35, 1 - (u - 0.5) * 0.8)
  const discharge = Math.round(400 + u * 1100 + Math.sin(u * Math.PI * 4) * 80)
  const minutes = Math.floor(u * (14 * 60 + 22))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const s = Math.floor((u * 1000) % 60)
  const clock = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} GMT`
  let riskLabel = 'ADVISORY'
  if (risk >= 75) riskLabel = 'CRITICAL'
  else if (risk >= 50) riskLabel = 'HIGH'
  return {
    risk: Math.round(Math.min(100, Math.max(0, risk))),
    riskLabel,
    pathOpacity: Math.min(1, Math.max(0.15, pathOpacity)),
    discharge,
    clock,
  }
}
