export type RiskTier = 'critical' | 'high' | 'advisory' | 'safe'

export type Lake = {
  id: string
  nodeId: string
  name: string
  basin: string
  state: string
  lat: number
  lng: number
  riskScore: number
  tier: RiskTier
  vulnerablePop: number
  lastUpdated: string
  watchId: string
  predictions: { h72: number; h24: number; h6: number }
  telemetry: {
    waterLevelMPerHr: number
    seismicMag: number
    areaDeltaPct: number
  }
  shap: { feature: string; value: number; direction: 'up' | 'down' }[]
  floodProjection: { timeBand: string; village: string; popAtRisk: number; urgency: 'critical' | 'elevated' | 'watch' }[]
  escalationLevel: number
  smsSent: number
}
