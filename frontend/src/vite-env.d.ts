/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** FastAPI root, e.g. `http://localhost:8000` — no trailing slash. Empty = demo data only. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.md?raw' {
  const content: string
  export default content
}
