import { useEffect, useRef, useState } from 'react'
import { fetchLakes } from '@/api/lakesApi'
import { getApiBaseUrl } from '@/api/config'
import { useToast } from '@/hooks/useToast'
import { MOCK_LAKES } from '@/mocks/lakes'
import type { Lake } from '@/types/lake'

export type LakesQueryState = {
  lakes: Lake[]
  loading: boolean
  source: 'api' | 'mock'
}

export function useLakesQuery(): LakesQueryState {
  const { pushToast } = useToast()
  const pushRef = useRef(pushToast)

  useEffect(() => {
    pushRef.current = pushToast
  }, [pushToast])

  const [state, setState] = useState<LakesQueryState>(() => ({
    lakes: MOCK_LAKES,
    loading: Boolean(getApiBaseUrl()),
    source: 'mock',
  }))

  useEffect(() => {
    const base = getApiBaseUrl()
    if (!base) return

    let cancelled = false

    void (async () => {
      try {
        const lakes = await fetchLakes()
        if (cancelled) return
        if (!lakes.length) {
          pushRef.current({ message: 'API returned no lakes — using demo data', variant: 'warning' })
          setState({ lakes: MOCK_LAKES, loading: false, source: 'mock' })
          return
        }
        setState({ lakes, loading: false, source: 'api' })
      } catch {
        if (cancelled) return
        pushRef.current({
          message: 'Could not reach glacier API — showing offline demo data',
          variant: 'warning',
        })
        setState({ lakes: MOCK_LAKES, loading: false, source: 'mock' })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
