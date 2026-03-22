import type { ReactNode } from 'react'
import { TopNav } from '@/components/layout/TopNav'

type AppShellProps = {
  children: ReactNode
  /** Optional banner below header (e.g. critical alert) */
  banner?: ReactNode
  /** Main area fills viewport under header */
  mainClassName?: string
}

export function AppShell({ children, banner, mainClassName }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-on-surface">
      <TopNav />
      {banner}
      <main className={mainClassName ?? 'flex min-h-0 flex-1 flex-col overflow-hidden'}>{children}</main>
    </div>
  )
}
