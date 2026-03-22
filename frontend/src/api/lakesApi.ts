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
