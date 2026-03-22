import { getApiBaseUrl } from '@/api/config'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** GET JSON relative to `VITE_API_BASE_URL` (must be configured). */
export async function apiGetJson<T>(path: string): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '')
  if (!base) throw new ApiError('VITE_API_BASE_URL is not set', 0)
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url)
  if (!res.ok) throw new ApiError(`Request failed: ${res.status}`, res.status)
  return res.json() as Promise<T>
}
