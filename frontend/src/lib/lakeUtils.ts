import type { Lake } from '@/types/lake'

export function lakeByIdFrom(lakes: Lake[], id: string | null | undefined): Lake | undefined {
  if (!id) return undefined
  return lakes.find((l) => l.id === id)
}

export function defaultLakeIdFrom(lakes: Lake[]): string {
  return lakes[0]?.id ?? ''
}
