import { getApiBaseUrl } from '@/api/config'

export interface SystemHealthResponse {
  status: 'ok' | 'degraded' | string
  database: 'ok' | string
  service: string
  copernicus?: {
    configured?: boolean
    auth_mode?: string
    catalogue_url?: string
    worker?: {
      running?: boolean
      last_run_at?: string | null
      last_status?: string | null
      last_error?: string | null
      lakes_synced?: number
      lakes_total?: number
    }
  }
}

export async function fetchSystemHealth(): Promise<SystemHealthResponse> {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const url = `${base}/status`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeoutId)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return (await res.json()) as SystemHealthResponse
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}
