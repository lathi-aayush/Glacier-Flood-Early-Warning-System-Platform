import { useEffect, useRef, useState } from 'react'
import { fetchAlerts } from '@/api/alertsApi'
import { getApiBaseUrl } from '@/api/config'
import { useToast } from '@/hooks/useToast'
import { MOCK_ALERTS } from '@/mocks/alerts'
import type { AlertEntry } from '@/types/alert'

export type AlertsQueryState = {
  alerts: AlertEntry[]
  loading: boolean
  source: 'api' | 'mock'
}

export function useAlertsQuery(): AlertsQueryState {
  const { pushToast } = useToast()
  const pushRef = useRef(pushToast)

  useEffect(() => {
    pushRef.current = pushToast
  }, [pushToast])

  const [state, setState] = useState<AlertsQueryState>(() => ({
    alerts: MOCK_ALERTS,
    loading: Boolean(getApiBaseUrl()),
    source: 'mock',
  }))

  useEffect(() => {
    const base = getApiBaseUrl()
    if (!base) return

    let cancelled = false

    void (async () => {
      try {
        const alerts = await fetchAlerts()
        if (cancelled) return
        if (!alerts.length) {
          pushRef.current({ message: 'API returned no alerts — using demo log', variant: 'warning' })
          setState({ alerts: MOCK_ALERTS, loading: false, source: 'mock' })
          return
        }
        setState({ alerts, loading: false, source: 'api' })
      } catch {
        if (cancelled) return
        pushRef.current({
          message: 'Could not load alerts — showing offline demo log',
          variant: 'warning',
        })
        setState({ alerts: MOCK_ALERTS, loading: false, source: 'mock' })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
