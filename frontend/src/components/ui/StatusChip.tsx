import type { ReactNode } from 'react'
import type { AlertEntry } from '@/types/alert'
import type { Lake } from '@/types/lake'

type Tier = Lake['tier']
type AlertSev = AlertEntry['severity']

type StatusChipProps = {
  children: ReactNode
  className?: string
}

/** Semi-transparent chips per DESIGN.md status guidance */
export function StatusChip({ children, className = '' }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${className}`.trim()}
    >
      {children}
    </span>
  )
}

/** Tier label only — no numeric score (dashboard list) */
export function TierBadge({ tier }: { tier: Tier }) {
  const label =
    tier === 'critical' ? 'CRITICAL' : tier === 'high' ? 'HIGH' : tier === 'advisory' ? 'ADVISORY' : 'SAFE'
  const cls =
    tier === 'critical'
      ? 'bg-error/20 text-error'
      : tier === 'high'
        ? 'bg-primary/15 text-primary'
        : tier === 'advisory'
          ? 'bg-secondary-container/30 text-secondary'
          : 'bg-on-surface-variant/20 text-on-surface-variant'
  return <StatusChip className={`${cls} !px-2.5 !py-1 !text-xs`.trim()}>{label}</StatusChip>
}

export function RiskTierChip({ tier, score }: { tier: Tier; score: number }) {
  const label = `${Math.round(score)}/100`
  const cls =
    tier === 'critical'
      ? 'bg-error/20 text-error'
      : tier === 'high'
        ? 'bg-primary/15 text-primary'
        : tier === 'advisory'
          ? 'bg-secondary-container/30 text-secondary'
          : 'bg-on-surface-variant/20 text-on-surface-variant'
  return <StatusChip className={cls}>{label}</StatusChip>
}

export function InventoryRiskChip({ tier, score }: { tier: Tier; score: number }) {
  const text =
    tier === 'critical'
      ? `${score.toFixed(1)} CRITICAL`
      : tier === 'high'
        ? `${score.toFixed(1)} HIGH`
        : tier === 'advisory'
          ? `${score.toFixed(1)} ADVISORY`
          : `${score.toFixed(1)} SAFE`
  const cls =
    tier === 'critical'
      ? 'border border-error/20 bg-error-container/30 text-error'
      : tier === 'high'
        ? 'border border-secondary/20 bg-secondary-container/30 text-secondary uppercase'
        : tier === 'advisory'
          ? 'border border-tertiary/20 bg-tertiary-container/20 text-tertiary uppercase'
          : 'border border-outline-variant/20 bg-outline-variant/20 text-outline uppercase'
  return (
    <StatusChip className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${cls}`.trim()}>{text}</StatusChip>
  )
}

export function AlertSeverityTitle({ severity }: { severity: AlertSev }) {
  const label = severity === 'critical' ? 'CRITICAL' : severity === 'high' ? 'HIGH ALERT' : 'ADVISORY'
  const cls =
    severity === 'critical' ? 'text-error' : severity === 'high' ? 'text-primary' : 'text-on-surface-variant'
  return <span className={`text-sm font-bold ${cls}`.trim()}>{label}</span>
}

export function DispatchStatusChip({ status }: { status: AlertEntry['status'] }) {
  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1 rounded bg-error/10 px-2 py-1 font-label text-[10px] uppercase tracking-widest text-error">
        <span className="material-symbols-outlined text-[12px]" aria-hidden>
          pending
        </span>{' '}
        Pending
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 font-label text-[10px] uppercase tracking-widest text-primary-container">
      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
        check_circle
      </span>{' '}
      Ack
    </span>
  )
}

export function ChannelChip({ label }: { label: string }) {
  return (
    <span className="border border-outline-variant/10 bg-surface-container-lowest px-1.5 py-0.5 text-[10px] text-on-surface-variant">
      {label}
    </span>
  )
}
