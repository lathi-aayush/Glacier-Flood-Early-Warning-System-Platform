/** Base URL for GlacierGuard REST API. Defaults to deployed Render backend. */
export function getApiBaseUrl(): string {
  return (
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    'https://glacier-flood-early-warning-system.onrender.com'
  )
}
