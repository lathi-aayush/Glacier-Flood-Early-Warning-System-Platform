import { apiGetJson } from '@/api/http'
import { normalizeLake, normalizeLakesPayload } from '@/api/normalize'
import type { Lake } from '@/types/lake'

export async function fetchLakes(): Promise<Lake[]> {
  const data = await apiGetJson<unknown>('/lakes')
  return normalizeLakesPayload(data)
}

export async function fetchLake(lakeId: string): Promise<Lake | null> {
  const data = await apiGetJson<unknown>(`/lakes/${encodeURIComponent(lakeId)}`)
  return normalizeLake(data)
}

export interface LakeFeatureSnapshot {
  id: number
  lakeId: string
  timestamp: string
  precip24hMm: number
  precip7dMm: number
  tempC: number
  freezingLevelM: number
  seismicMaxMag: number
  waterAreaKm2: number
  areaDeltaPct: number
  cloudCoverPct: number | null
  satelliteScene: string | null
  source: string
}

export async function fetchLakeFeatures(lakeId: string, limit = 20): Promise<LakeFeatureSnapshot[]> {
  try {
    const data = await apiGetJson<LakeFeatureSnapshot[]>(`/lakes/${encodeURIComponent(lakeId)}/features?limit=${limit}`)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export interface SimulateScenarioParams {
  lake_id: string
  precip_24h_mm?: number
  precip_7d_mm?: number
  temp_c?: number
  freezing_level_m?: number
  seismic_mag?: number
  water_area_km2?: number
  area_delta_pct?: number
}

export interface SimulationResult {
  lake_id: string
  lake_name: string
  baseline_risk_score: number
  baseline_tier: string
  simulated_risk_score: number
  simulated_tier: string
  risk_delta: number
  is_anomaly: boolean
  shap: Array<{ feature: string; value: number; direction: 'up' | 'down' }>
  waterfall: {
    base_score: number
    final_score: number
    steps: Array<{
      label: string
      feature: string
      delta: number
      value_text?: string
      direction: 'up' | 'down'
    }>
  }
  sop: {
    protocol_level: string
    priority: string
    authority: string
    primary_driver: string
    evacuation_urgency: string
    actions: string[]
  }
  simulated_features: Record<string, number>
}

import { apiPostJson } from '@/api/http'

export async function simulateScenario(params: SimulateScenarioParams): Promise<SimulationResult> {
  return apiPostJson<SimulationResult>('/ml/simulate', params)
}

export interface FloodPathProperties {
  feature_type: 'flood_path'
  lake_id: string
  lake_name: string
  waypoints: Array<{
    name: string
    coords: [number, number]
    elev_m: number
    dist_km: number
    eta_mins: number
  }>
  total_distance_km: number
  total_drop_m: number
  peak_discharge_m3_s: number
  avg_velocity_m_s: number
}

export interface LakePolygonProperties {
  feature_type: 'lake_polygon'
  lake_id: string
  lake_name: string
  outlet_elev_m: number
  dam_type: string
  lake_volume_m3: number
}

export interface SettlementProperties {
  feature_type: 'settlement'
  settlement_id: string
  name: string
  pop_at_risk: number
  eta: string
  urgency: 'critical' | 'elevated' | 'watch'
  elev_m: number
  lake_id: string
}

export interface LakeGeoJsonFeature {
  type: 'Feature'
  id: string
  geometry: {
    type: 'Polygon' | 'LineString' | 'Point'
    coordinates: any
  }
  properties: FloodPathProperties | LakePolygonProperties | SettlementProperties | Record<string, any>
}

export interface LakeFloodPathGeoJson {
  type: 'FeatureCollection'
  properties: {
    lake_id: string
    lake_name: string
    breach_hydrology: {
      lake_volume_m3: number
      peak_discharge_m3_s: number
      average_velocity_m_s: number
      dam_type: string
    }
  }
  features: LakeGeoJsonFeature[]
}

export async function fetchLakeFloodPath(lakeId: string): Promise<LakeFloodPathGeoJson | null> {
  try {
    const data = await apiGetJson<LakeFloodPathGeoJson>(`/lakes/${encodeURIComponent(lakeId)}/flood-path`)
    if (data?.features) {
      for (const feature of data.features) {
        if (feature.geometry?.type === 'Polygon' && Array.isArray(feature.geometry.coordinates?.[0])) {
          feature.geometry.coordinates[0] = (feature.geometry.coordinates[0] as [number, number][]).map(([lng, lat]) => {
            // Fix Thorthormi Lake Complex stale backend coordinate (77.722 -> 90.238)
            if (lakeId === 'gl-00504' && Math.abs(lng - 77.722) < 0.5) {
              return [90.2380, lat]
            }
            return [lng, lat]
          })
        }
      }
    }
    return data
  } catch {
    return null
  }
}

