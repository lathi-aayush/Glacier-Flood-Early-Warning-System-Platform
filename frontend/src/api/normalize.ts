import type { AlertApiRecord } from '@/api/types'
import { MOCK_LAKES } from '@/mocks/lakes'
import type { AlertEntry } from '@/types/alert'
import type { Lake, RiskTier } from '@/types/lake'

const FALLBACK_LAKE: Lake = MOCK_LAKES[0]!

function isTier(s: string): s is RiskTier {
  return s === 'critical' || s === 'high' || s === 'advisory' || s === 'safe'
}

function pickStr(o: Record<string, unknown>, keys: string[], fb: string) {
  for (const k of keys) {
    const v = o[k]
    if (v != null && String(v).length) return String(v)
  }
  return fb
}

function pickNum(o: Record<string, unknown>, keys: string[], fb: number) {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'number' && !Number.isNaN(v)) return v
  }
  return fb
}

export function normalizeLake(raw: unknown): Lake | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = o.id != null ? String(o.id) : ''
  if (!id) return null
  const mock = MOCK_LAKES.find((m) => m.id === id)
  const base = mock ?? { ...FALLBACK_LAKE, id, name: pickStr(o, ['name'], `Lake ${id}`) }
  const tr = pickStr(o, ['tier'], base.tier).toLowerCase()
  const tier: RiskTier = isTier(tr) ? tr : base.tier

  return {
    ...base,
    id,
    nodeId: pickStr(o, ['node_id', 'nodeId'], base.nodeId),
    name: pickStr(o, ['name'], base.name),
    basin: pickStr(o, ['basin'], base.basin),
    state: pickStr(o, ['state'], base.state),
    lat: pickNum(o, ['lat', 'latitude'], base.lat),
    lng: pickNum(o, ['lng', 'lon', 'longitude'], base.lng),
    riskScore: pickNum(o, ['risk_score', 'riskScore'], base.riskScore),
    tier,
    vulnerablePop: pickNum(o, ['vulnerable_pop', 'vulnerablePop'], base.vulnerablePop),
    lastUpdated: pickStr(o, ['last_updated', 'lastUpdated'], base.lastUpdated),
    watchId: pickStr(o, ['watch_id', 'watchId'], base.watchId),
    escalationLevel: pickNum(o, ['escalation_level', 'escalationLevel'], base.escalationLevel),
    smsSent: pickNum(o, ['sms_sent', 'smsSent'], base.smsSent),
  }
}

export function normalizeLakesPayload(data: unknown): Lake[] {
  const rows: unknown[] = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { lakes?: unknown[] }).lakes)
      ? ((data as { lakes: unknown[] }).lakes ?? [])
      : []
  const out: Lake[] = []
  for (const row of rows) {
    const lake = normalizeLake(row)
    if (lake) out.push(lake)
  }
  return out
}

function isSeverity(s: string): s is AlertEntry['severity'] {
  return s === 'critical' || s === 'high' || s === 'advisory'
}

export function normalizeAlert(raw: unknown): AlertEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as AlertApiRecord & Record<string, unknown>
  const id = o.id != null ? String(o.id) : ''
  if (!id) return null
  const sevRaw = pickStr(o as Record<string, unknown>, ['severity'], 'advisory').toLowerCase()
  const severity: AlertEntry['severity'] = isSeverity(sevRaw) ? sevRaw : 'advisory'
  const st = pickStr(o as Record<string, unknown>, ['status'], 'ack').toLowerCase()
  const status: AlertEntry['status'] = st === 'pending' ? 'pending' : 'ack'
  const channels = Array.isArray(o.channels) ? o.channels.map((c) => String(c)) : []

  return {
    id,
    ts: pickStr(o as Record<string, unknown>, ['ts', 'timestamp', 'created_at'], new Date().toISOString()),
    severity,
    lakeName: pickStr(o as Record<string, unknown>, ['lake_name', 'lakeName'], 'Unknown lake'),
    lakeId: pickStr(o as Record<string, unknown>, ['lake_id', 'lakeId'], ''),
    smsCount: pickNum(o as Record<string, unknown>, ['sms_count', 'smsCount'], 0),
    channels,
    status,
  }
}

export function normalizeAlertsPayload(data: unknown): AlertEntry[] {
  const rows: unknown[] = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { alerts?: unknown[] }).alerts)
      ? ((data as { alerts: unknown[] }).alerts ?? [])
      : []
  const out: AlertEntry[] = []
  for (const row of rows) {
    const a = normalizeAlert(row)
    if (a) out.push(a)
  }
  return out
}
