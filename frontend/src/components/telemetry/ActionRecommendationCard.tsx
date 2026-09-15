import React, { useState } from 'react'
import { InfoTooltip } from '@/components/ui'

export interface SopDirective {
  protocol_level: string
  priority: string
  authority: string
  primary_driver: string
  evacuation_urgency: string
  actions: string[]
}

interface ActionRecommendationCardProps {
  sop?: SopDirective | null
  tier: string
  lakeName: string
  className?: string
}

export const ActionRecommendationCard: React.FC<ActionRecommendationCardProps> = ({
  sop,
  tier,
  lakeName,
  className = '',
}) => {
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)

  if (!sop) {
    return null
  }

  const toggleAction = (index: number) => {
    setCompletedActions((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const getTierTheme = (t: string) => {
    if (t === 'critical') {
      return {
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        border: 'border-rose-500/60 shadow-rose-950/40',
        indicator: 'bg-rose-500 animate-ping',
        titleColor: 'text-rose-400',
        bannerBg: 'bg-rose-950/40 border-rose-900/60',
      }
    }
    if (t === 'high') {
      return {
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        border: 'border-amber-500/60 shadow-amber-950/40',
        indicator: 'bg-amber-500',
        titleColor: 'text-amber-400',
        bannerBg: 'bg-amber-950/30 border-amber-900/50',
      }
    }
    if (t === 'advisory') {
      return {
        badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        border: 'border-yellow-500/50 shadow-yellow-950/30',
        indicator: 'bg-yellow-500',
        titleColor: 'text-yellow-400',
        bannerBg: 'bg-yellow-950/20 border-yellow-900/40',
      }
    }
    return {
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      border: 'border-emerald-500/40 shadow-emerald-950/20',
      indicator: 'bg-emerald-500',
      titleColor: 'text-emerald-400',
      bannerBg: 'bg-emerald-950/20 border-emerald-900/30',
    }
  }

  const theme = getTierTheme(tier.toLowerCase())

  const copySopToClipboard = () => {
    const text = `GLACIERGUARD EMERGENCY DIRECTIVE
Lake: ${lakeName}
Protocol: ${sop.protocol_level}
Priority: ${sop.priority}
Authority: ${sop.authority}
Evacuation Urgency: ${sop.evacuation_urgency}
Primary Trigger: ${sop.primary_driver}

OPERATIONAL ACTIONS:
${sop.actions.map((act, i) => `${i + 1}. [${completedActions[i] ? 'DONE' : 'PENDING'}] ${act}`).join('\n')}
`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`p-4 rounded-xl border ${theme.border} bg-slate-950/70 backdrop-blur-md shadow-xl ${className}`}>
      {/* Top Banner */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.indicator}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.badgeBg}`} />
            </span>
            <span className={`text-xs font-mono font-bold tracking-wide uppercase ${theme.titleColor}`}>
              {sop.protocol_level}
            </span>
            <InfoTooltip
              title="NDMA / CWC SOP Protocol"
              content="Standardized emergency protocols formulated with the National Disaster Management Authority for early glacial breach containment."
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400">{sop.authority}</span>
        </div>

        <button
          onClick={copySopToClipboard}
          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1 shadow-sm shrink-0"
          title="Copy protocol directive to clipboard"
        >
          {copied ? '✓ Copied' : '📋 Copy SOP'}
        </button>
      </div>

      {/* Urgency & Primary Driver Strip */}
      <div className={`p-2.5 rounded-lg border ${theme.bannerBg} mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-300 font-semibold">Urgency:</span>
          <span className={`text-[11px] font-bold font-mono ${theme.titleColor}`}>
            {sop.evacuation_urgency}
          </span>
          <InfoTooltip
            title="Evacuation Urgency Window"
            content="Estimated time buffer before potential moraine dam breach floodwave reaches the closest downstream settlement."
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Driver:</span>
          <span className="text-[11px] font-mono text-slate-200 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
            {sop.primary_driver}
          </span>
          <InfoTooltip
            title="Primary Physical Driver"
            content="The single strongest risk driver identified by TreeSHAP feature attribution for this lake."
          />
        </div>
      </div>

      {/* Operational SOP Checklist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
          <span className="flex items-center gap-1">
            <span>Mandatory Action Checklist</span>
            <InfoTooltip
              title="Operator Checklist"
              content="Click each item to check off operational protocols as emergency teams execute them in the field."
            />
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {Object.values(completedActions).filter(Boolean).length} / {sop.actions.length} Completed
          </span>
        </div>

        {sop.actions.map((action, idx) => {
          const isDone = Boolean(completedActions[idx])
          return (
            <div
              key={idx}
              onClick={() => toggleAction(idx)}
              className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                isDone
                  ? 'bg-slate-900/40 border-slate-800/60 text-slate-500 line-through'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-slate-900'
              }`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => {}} // Handled by div click
                className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-950 cursor-pointer shrink-0"
              />
              <span className="leading-snug text-[11px]">{action}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
