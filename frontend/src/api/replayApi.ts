import { apiGetJson } from '@/api/http'
import type { ReplayApiResponse } from '@/api/types'

/** Optional; returns null if API is down or route missing. */
export async function fetchReplayEvent(eventId: string): Promise<ReplayApiResponse | null> {
  try {
    return await apiGetJson<ReplayApiResponse>(`/replay/${encodeURIComponent(eventId)}`)
  } catch {
    return null
  }
}
