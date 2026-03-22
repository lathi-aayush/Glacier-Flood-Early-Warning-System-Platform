import { createContext } from 'react'
import type { Lake } from '@/types/lake'

export type LakeSelectionContextValue = {
  lakes: Lake[]
  lakesLoading: boolean
  dataSource: 'api' | 'mock'
  selectedId: string
  selectedLake: Lake
  setSelectedId: (id: string) => void
  syncFromRouteLakeParam: (id: string | null) => void
}

export const LakeSelectionContext = createContext<LakeSelectionContextValue | null>(null)
