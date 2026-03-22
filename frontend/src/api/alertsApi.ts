import { apiGetJson } from '@/api/http'
import { normalizeAlertsPayload } from '@/api/normalize'
import type { AlertEntry } from '@/types/alert'

export async function fetchAlerts(): Promise<AlertEntry[]> {
  const data = await apiGetJson<unknown>('/alerts')
  return normalizeAlertsPayload(data)
}
