import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { LakeSelectionContext } from '@/context/lakeSelectionContext'
import { defaultLakeIdFrom, lakeByIdFrom } from '@/lib/lakeUtils'
import { MOCK_LAKES } from '@/mocks/lakes'
import type { Lake } from '@/types/lake'

type LakeSelectionProviderProps = {
  children: ReactNode
  lakes: Lake[]
  lakesLoading?: boolean
  dataSource?: 'api' | 'mock'
}

export function LakeSelectionProvider({
  children,
  lakes,
  lakesLoading = false,
  dataSource = 'mock',
}: LakeSelectionProviderProps) {
  const effectiveLakes = lakes.length > 0 ? lakes : MOCK_LAKES
  const [selection, setSelection] = useState(() => defaultLakeIdFrom(effectiveLakes))

  const selectedId = useMemo(() => {
    if (lakeByIdFrom(effectiveLakes, selection)) return selection
    return defaultLakeIdFrom(effectiveLakes)
  }, [effectiveLakes, selection])

  const setSelectedId = useCallback(
    (id: string) => {
      const next = lakeByIdFrom(effectiveLakes, id)?.id ?? defaultLakeIdFrom(effectiveLakes)
      setSelection(next)
    },
    [effectiveLakes],
  )

  const syncFromRouteLakeParam = useCallback(
    (id: string | null) => {
      if (id && lakeByIdFrom(effectiveLakes, id)) setSelection(id)
    },
    [effectiveLakes],
  )

  const selectedLake = useMemo(
    () => lakeByIdFrom(effectiveLakes, selectedId) ?? effectiveLakes[0]!,
    [effectiveLakes, selectedId],
  )

  const value = useMemo(
    () => ({
      lakes: effectiveLakes,
      lakesLoading,
      dataSource,
      selectedId,
      selectedLake,
      setSelectedId,
      syncFromRouteLakeParam,
    }),
    [effectiveLakes, lakesLoading, dataSource, selectedId, selectedLake, setSelectedId, syncFromRouteLakeParam],
  )

  return <LakeSelectionContext.Provider value={value}>{children}</LakeSelectionContext.Provider>
}
