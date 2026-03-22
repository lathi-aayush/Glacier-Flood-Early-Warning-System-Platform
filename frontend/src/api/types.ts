/**
 * Expected FastAPI-style JSON (snake_case) the UI can consume.
 * Backend may return a bare array or `{ "lakes": [...] }`.
 *
 * Endpoints (contract):
 * - GET /lakes
 * - GET /lakes/{lake_id}
 * - GET /alerts
 * - GET /replay/{event_id}  (optional; replay UI degrades to mock timeline)
 */
export type LakeApiRecord = {
  id: string
  node_id?: string
  name?: string
  basin?: string
  state?: string
  lat?: number
  lng?: number
  lon?: number
  risk_score?: number
  tier?: string
  vulnerable_pop?: number
  last_updated?: string
  watch_id?: string
  escalation_level?: number
  sms_sent?: number
}

export type AlertApiRecord = {
  id: string
  ts?: string
  severity?: string
  lake_name?: string
  lake_id?: string
  sms_count?: number
  channels?: string[]
  status?: string
}

export type ReplayApiResponse = {
  event_id?: string
  label?: string
  /** Normalized timeline samples 0..1 if backend provides them */
  samples?: { t: number; risk: number; discharge: number; path_opacity: number }[]
}
