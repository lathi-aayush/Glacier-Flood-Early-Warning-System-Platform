import { useState, useEffect, useCallback } from 'react'

const WATCHLIST_STORAGE_KEY = 'glacierguard_user_watchlist_v1'

export function useWatchlist() {
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlistIds))
    } catch {
      // ignore storage errors
    }
  }, [watchlistIds])

  const isInWatchlist = useCallback(
    (lakeId: string) => watchlistIds.includes(lakeId),
    [watchlistIds],
  )

  const toggleWatchlist = useCallback((lakeId: string): boolean => {
    let isNowIn = false
    setWatchlistIds((prev) => {
      if (prev.includes(lakeId)) {
        isNowIn = false
        return prev.filter((id) => id !== lakeId)
      } else {
        isNowIn = true
        return [...prev, lakeId]
      }
    })
    return isNowIn
  }, [])

  const addToWatchlist = useCallback((lakeId: string) => {
    setWatchlistIds((prev) => (prev.includes(lakeId) ? prev : [...prev, lakeId]))
  }, [])

  const removeFromWatchlist = useCallback((lakeId: string) => {
    setWatchlistIds((prev) => prev.filter((id) => id !== lakeId))
  }, [])

  const clearWatchlist = useCallback(() => {
    setWatchlistIds([])
  }, [])

  return {
    watchlistIds,
    watchlistCount: watchlistIds.length,
    isInWatchlist,
    toggleWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
  }
}
