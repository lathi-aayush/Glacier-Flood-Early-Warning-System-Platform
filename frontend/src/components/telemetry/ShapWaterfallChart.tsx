import React from 'react'
import { InfoTooltip } from '@/components/ui'

export interface WaterfallStep {
  label: string
  feature: string
  delta: number
  value_text?: string
  direction: 'up' | 'down'
}

export interface WaterfallData {
  base_score: number
  final_score: number
  steps: WaterfallStep[]
}

interface ShapWaterfallChartProps {
  data?: WaterfallData | null
  className?: string
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({
  data,
  className = '',
}) => {
  if (!data || !data.steps || data.steps.length === 0) {
    return (
      <div className={`p-4 rounded-xl border border-slate-800 bg-slate-900/50 text-center ${className}`}>
        <p className="text-xs text-slate-500">No SHAP attribution waterfall available for this lake.</p>
      </div>
    )
  }

  const { base_score, final_score, steps } = data

  const getTierColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/40' }
    if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/40' }
    if (score >= 25) return { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/40' }
    return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40' }
  }

  const finalTheme = getTierColor(final_score)

  return (
    <div className={`p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md shadow-lg ${className}`}>
      {/* Header with Title & InfoTooltip */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 uppercase">
            TreeSHAP Risk Waterfall
          </span>
          <InfoTooltip
            title="TreeSHAP Explanation"
            content="Decomposes the model's prediction step-by-step. Shows how each physical trigger adds to (red) or subtracts from (green) the baseline risk to reach the final score."
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">
            Base <span className="text-slate-200 font-bold">{base_score}%</span>
          </span>
          <span className="text-slate-600 text-xs">➔</span>
          <span className={`text-[10px] font-mono font-bold ${finalTheme.text}`}>
            Final {final_score}%
          </span>
        </div>
      </div>

      {/* Step by Step Breakdown */}
      <div className="space-y-2.5">
        {/* Baseline Bar */}
        <div className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/60 border border-slate-800/70">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-slate-500 inline-block" />
            <span className="text-slate-300 font-medium text-[11px]">Unperturbed Equilibrium (Base)</span>
            <InfoTooltip
              title="Equilibrium Baseline"
              content="The average expected breach risk for a quiescent Himalayan lake before applying live sensor spikes."
            />
          </div>
          <span className="font-mono text-[11px] text-slate-400 font-semibold">{base_score}%</span>
        </div>

        {/* Dynamic Feature Steps */}
        {steps.map((step, idx) => {
          const isUp = step.direction === 'up'
          const deltaSign = isUp ? '+' : ''
          const deltaColor = isUp ? 'text-rose-400' : 'text-emerald-400'
          const bgBar = isUp ? 'bg-rose-500/80' : 'bg-emerald-500/80'
          const barWidth = Math.min(100, Math.max(8, Math.abs(step.delta) * 1.5))

          // Specific tooltip description for each physical feature
          const getFeatureTooltip = (feat: string) => {
            if (feat === 'PRECIP') {
              return {
                title: 'Precipitation Influx',
                content: 'Monsoon rainfall increases lake volume and hydrostatic pressure against the moraine dam.',
              }
            }
            if (feat === 'TEMP') {
              return {
                title: 'Thermal Melt & Freezing Level',
                content: 'High temperatures raise the 0°C freezing level, accelerating glacier ice melting into the lake.',
              }
            }
            if (feat === 'STRESS') {
              return {
                title: 'Moraine Dam Stress',
                content: 'Satellite area expansion indicates moraine dam structural dilation and internal piping stress.',
              }
            }
            return {
              title: 'Seismic Trigger',
              content: 'Earthquake ground acceleration can trigger moraine avalanches or collapse fragile dam walls.',
            }
          }

          const tip = getFeatureTooltip(step.feature)

          return (
            <div key={idx} className="group flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                  <span className="text-slate-200 text-[11px] font-medium">{step.label}</span>
                  <InfoTooltip title={tip.title} content={tip.content} />
                  {step.value_text && (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                      {step.value_text}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`font-mono text-[11px] font-bold ${deltaColor}`}>
                    {deltaSign}{step.delta}%
                  </span>
                  <span className={`text-[9px] ${deltaColor}`}>{isUp ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Progress Bar showing contribution */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
                <div
                  className={`h-full ${bgBar} rounded-full transition-all duration-300`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        })}

        {/* Final Cumulative Result Bar */}
        <div className={`mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs py-1.5 px-2 rounded bg-slate-900/90 border ${finalTheme.border}`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${finalTheme.bg} inline-block animate-pulse`} />
            <span className="text-slate-100 font-semibold text-[11px]">Cumulative GLOF Risk Output</span>
            <InfoTooltip
              title="Calibrated GLOF Risk"
              content="The final cumulative breach probability (0–100%) predicted by the machine learning model based on all combined triggers."
            />
          </div>
          <span className={`font-mono text-sm font-black ${finalTheme.text}`}>
            {final_score}%
          </span>
        </div>
      </div>
    </div>
  )
}
