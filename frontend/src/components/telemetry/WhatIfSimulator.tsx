import React, { useState, useEffect, useRef } from 'react'
import type { Lake } from '@/types/lake'
import { simulateScenario, type SimulationResult } from '@/api/lakesApi'
import { InfoTooltip } from '@/components/ui'
import { ShapWaterfallChart } from '@/components/telemetry/ShapWaterfallChart'
import { ActionRecommendationCard } from '@/components/telemetry/ActionRecommendationCard'

interface WhatIfSimulatorProps {
  lake: Lake
  className?: string
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ lake, className = '' }) => {
  // Extract live baseline values from lake object
  const livePrecip = 5.0
  const liveTemp = 2.0
  const liveSeismic = lake.telemetry?.seismicMag ?? 0.0
  const liveDelta = lake.telemetry?.areaDeltaPct ?? 0.0

  // Slider states
  const [precip, setPrecip] = useState<number>(livePrecip)
  const [temp, setTemp] = useState<number>(liveTemp)
  const [seismic, setSeismic] = useState<number>(liveSeismic)
  const [areaDelta, setAreaDelta] = useState<number>(liveDelta)

  // Simulation result state
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const debounceTimer = useRef<number | null>(null)

  // Sync with lake changes
  useEffect(() => {
    setPrecip(livePrecip)
    setTemp(liveTemp)
    setSeismic(liveSeismic)
    setAreaDelta(liveDelta)
  }, [lake.id, livePrecip, liveTemp, liveSeismic, liveDelta])

  // Execute simulation with debounce
  useEffect(() => {
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await simulateScenario({
          lake_id: lake.id,
          precip_24h_mm: precip,
          temp_c: temp,
          seismic_mag: seismic,
          area_delta_pct: areaDelta,
        })
        setResult(res)
      } catch (err) {
        setError('Simulation failed: unable to reach ML backend.')
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current)
      }
    }
  }, [lake.id, precip, temp, seismic, areaDelta])

  const resetToLive = () => {
    setPrecip(livePrecip)
    setTemp(liveTemp)
    setSeismic(liveSeismic)
    setAreaDelta(liveDelta)
  }

  const applyCloudburstPreset = () => {
    setPrecip(85.0)
    setTemp(5.0)
  }

  const applyHeatwavePreset = () => {
    setTemp(8.5)
    setPrecip(15.0)
    setAreaDelta(12.0)
  }

  const applySeismicPreset = () => {
    setSeismic(6.1)
    setAreaDelta(18.0)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Intro & Controls Box */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              What-If Scenario Simulator
            </span>
            <InfoTooltip
              title="Hypothetical Stress Testing"
              content="Adjust weather and seismic sliders to simulate how future cloudbursts or heatwaves would alter this lake's risk score and evacuation directives."
            />
          </div>

          <button
            onClick={resetToLive}
            className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            🔄 Reset Live
          </button>
        </div>

        {/* Preset Quick Actions */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-500 mr-1">Presets:</span>
          <button
            onClick={applyCloudburstPreset}
            className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
          >
            🌧️ Cloudburst (85mm)
          </button>
          <button
            onClick={applyHeatwavePreset}
            className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition-colors"
          >
            ☀️ Heatwave (+8.5°C)
          </button>
          <button
            onClick={applySeismicPreset}
            className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 transition-colors"
          >
            ⚡ Quake (M 6.1)
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-3.5">
          {/* 1. Rainfall Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 font-medium text-[11px]">24h Monsoon Rainfall</span>
                <InfoTooltip
                  title="Rainfall Simulation"
                  content="Simulates sudden heavy monsoon cloudburst influx into the lake basin."
                />
                <span className="text-[10px] font-mono text-slate-500">(Live: {livePrecip.toFixed(1)}mm)</span>
              </div>
              <span className="font-mono text-xs font-bold text-cyan-400">{precip.toFixed(1)} mm</span>
            </div>
            <input
              type="range"
              min={0}
              max={150}
              step={1}
              value={precip}
              onChange={(e) => setPrecip(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 2. Temperature Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 font-medium text-[11px]">Ambient Temperature</span>
                <InfoTooltip
                  title="Temperature & Melt Simulation"
                  content="Simulates warming that elevates the freezing level and accelerates glacier melting."
                />
                <span className="text-[10px] font-mono text-slate-500">(Live: {liveTemp.toFixed(1)}°C)</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400">{temp.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min={-5}
              max={15}
              step={0.5}
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* 3. Seismic Magnitude Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 font-medium text-[11px]">Earthquake Magnitude</span>
                <InfoTooltip
                  title="Seismic Shaking Simulation"
                  content="Simulates local ground shaking on the Richter scale that could destabilize moraine walls."
                />
                <span className="text-[10px] font-mono text-slate-500">(Live: M {liveSeismic.toFixed(1)})</span>
              </div>
              <span className="font-mono text-xs font-bold text-rose-400">M {seismic.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={7.5}
              step={0.1}
              value={seismic}
              onChange={(e) => setSeismic(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
          </div>

          {/* 4. Moraine Dam Expansion Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 font-medium text-[11px]">Lake Surface Expansion</span>
                <InfoTooltip
                  title="Area Expansion Simulation"
                  content="Simulates rapid satellite-observed water boundary expansion and hydrostatic dam strain."
                />
                <span className="text-[10px] font-mono text-slate-500">(Live: {liveDelta >= 0 ? `+${liveDelta.toFixed(1)}` : liveDelta.toFixed(1)}%)</span>
              </div>
              <span className="font-mono text-xs font-bold text-purple-400">{areaDelta >= 0 ? `+${areaDelta.toFixed(1)}` : areaDelta.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={-5}
              max={40}
              step={0.5}
              value={areaDelta}
              onChange={(e) => setAreaDelta(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs text-cyan-400 font-mono flex items-center justify-center gap-2 animate-pulse">
          <span>⚙️ Running XGBoost & TreeSHAP inference...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-center text-xs text-rose-300 font-mono">
          {error}
        </div>
      )}

      {/* Simulation Outcome Section */}
      {result && !loading && (
        <div className="space-y-3.5">
          {/* Comparison Banner */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-lg flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Live vs. Simulated Risk
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-slate-400">
                  {result.baseline_risk_score}% ({result.baseline_tier})
                </span>
                <span className="text-slate-600">➔</span>
                <span className={`text-base font-mono font-black ${
                  result.simulated_risk_score >= 80 ? 'text-rose-400' :
                  result.simulated_risk_score >= 50 ? 'text-amber-400' :
                  result.simulated_risk_score >= 25 ? 'text-yellow-400' : 'text-emerald-400'
                }`}>
                  {result.simulated_risk_score}% ({result.simulated_tier.toUpperCase()})
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                result.risk_delta > 0
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {result.risk_delta >= 0 ? `+${result.risk_delta}%` : `${result.risk_delta}%`} Risk Shift
              </span>
              {result.is_anomaly && (
                <span className="text-[9px] font-mono bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800 flex items-center gap-1">
                  <span>⚠️ Outlier Event</span>
                </span>
              )}
            </div>
          </div>

          {/* Simulated SHAP Waterfall */}
          <ShapWaterfallChart data={result.waterfall} />

          {/* Simulated SOP Directive Card */}
          <ActionRecommendationCard
            sop={result.sop}
            tier={result.simulated_tier}
            lakeName={lake.name}
          />
        </div>
      )}
    </div>
  )
}
