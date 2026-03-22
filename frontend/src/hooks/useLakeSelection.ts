import { useContext } from 'react'
import { LakeSelectionContext } from '@/context/lakeSelectionContext'

export function useLakeSelection() {
  const ctx = useContext(LakeSelectionContext)
  if (!ctx) throw new Error('useLakeSelection must be used within LakeSelectionProvider')
  return ctx
}
