/** Empty string means “no API” — UI uses bundled demo data only. */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
}
