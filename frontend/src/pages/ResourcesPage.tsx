import { useState, useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/ui/SectionLabel'
import informationMd from '../../../resources/information.md?raw'

interface LakeTaxonomy {
  id: string
  name: string
  damType: string
  stability: 'Critical Concern' | 'Stable' | 'High Dynamic' | 'Variable'
  stabilityColor: string
  description: string
  failureModes: string[]
  hkhPrevalence: string
}

const LAKE_TAXONOMIES: LakeTaxonomy[] = [
  {
    id: 'moraine',
    name: 'Moraine-Dammed Lakes',
    damType: 'Glacial Till & Unconsolidated Debris',
    stability: 'Critical Concern',
    stabilityColor: 'text-error border-error/30 bg-error/10',
    description:
      'Lakes impounded behind loose terminal, lateral, or recessional moraines. Often contain buried ice cores that melt progressively (thermokarst), weakening structural cohesion.',
    failureModes: ['Internal piping / seepage', 'Displacement wave overtopping', 'Sudden breach incision'],
    hkhPrevalence: 'Dominant GLOF hazard across Eastern & Central Himalayas (e.g. Sikkim, Nepal, Bhutan)',
  },
  {
    id: 'ice',
    name: 'Ice-Dammed / Ice-Contact Lakes',
    damType: 'Glacier Tongue / Calving Ice Margin',
    stability: 'High Dynamic',
    stabilityColor: 'text-primary border-primary/30 bg-primary/10',
    description:
      'Impounded directly by glacial ice or situated on the glacier surface (supraglacial ponds). Prone to abrupt periodic drainage when water pressure floats the ice dam.',
    failureModes: ['Subglacial tunnel drainage (Jökulhlaup)', 'Ice dam flotation & flotation lifting', 'Marginal ice collapse'],
    hkhPrevalence: 'Common in Karakoram and Western Himalayas; exhibits cyclical surge and outburst patterns',
  },
  {
    id: 'bedrock',
    name: 'Bedrock-Dammed Lakes',
    damType: 'Solid Crystalline / Cirque Basin',
    stability: 'Stable',
    stabilityColor: 'text-tertiary border-tertiary/30 bg-tertiary/10',
    description:
      'Occupies glacially carved rock basins (cirques or rock-step tarns). The impounding lip is solid lithology rather than loose till, making spontaneous structural failure improbable.',
    failureModes: ['Mega-avalanche impact displacement wave', 'Channel outlet blockage & surge'],
    hkhPrevalence: 'Frequent in deglaciated alpine valleys; lowest baseline failure probability',
  },
  {
    id: 'hybrid',
    name: 'Hybrid / Landslide-Blocked Lakes',
    damType: 'Compound Mass Movement Debris',
    stability: 'Variable',
    stabilityColor: 'text-[#ffb74d] border-[#ffb74d]/30 bg-[#ffb74d]/10',
    description:
      'Formed where rockslides, debris avalanches, or tributary alluvial fans dam a high-gradient river valley. Lacks geological sorting and can collapse catastrophically upon filling.',
    failureModes: ['Rapid overtopping erosion', 'Pore pressure liquefaction', 'Secondary slope failure'],
    hkhPrevalence: 'Tectonically active Himalayan gorges with steep unstable valley walls',
  },
]

interface CaseStudy {
  id: string
  title: string
  year: string
  location: string
  trigger: string
  impact: string
  keyLesson: string
  badgeColor: string
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'south-lhonak',
    title: 'South Lhonak Lake Outburst Cascade',
    year: 'October 2023',
    location: 'North Sikkim, India (Teesta Basin)',
    trigger: 'Extreme precipitation pulse combined with lateral moraine / ice-rock avalanche displacement wave',
    impact: 'Destruction of the 1,200 MW Chungthang Dam (Teesta III), 100+ fatalities and severe downstream infrastructure wipeout across Dikchu, Singtam, and Rangpo.',
    keyLesson: 'Highlighting compound disaster cascades where GLOF surge energy multiplies when hitting artificial dams and bottlenecked river gorges.',
    badgeColor: 'border-error/40 text-error bg-error/10',
  },
  {
    id: 'kedarnath',
    title: 'Chorabari Lake / Kedarnath Disaster',
    year: 'June 2013',
    location: 'Uttarakhand, India (Mandakini Basin)',
    trigger: 'Multi-day cloudburst rainfall accelerating snowmelt, bursting the moraine-dammed Chorabari Tal (Gandhi Sarovar)',
    impact: 'Catastrophic debris flow and hyper-concentrated sediment surge devastating the Kedarnath temple town with thousands of casualties downstream.',
    keyLesson: 'Demonstrated the lethal synergy of early summer snowpack, monsoon cloudbursts, and sediment bulking in steep Himalayan channels.',
    badgeColor: 'border-[#ffb74d]/40 text-[#ffb74d] bg-[#ffb74d]/10',
  },
  {
    id: 'dig-tsho',
    title: 'Dig Tsho GLOF Benchmark',
    year: 'August 1985',
    location: 'Khumbu Region, Nepal (Dudh Koshi Basin)',
    trigger: 'Ice avalanche of ~150,000 m³ detached from Langmoche Glacier, triggering a 20-meter seiche displacement wave',
    impact: 'Breached the terminal moraine, releasing ~5 million m³ of water; destroyed Namche Small Hydroelectric Project, 14 bridges, and 30 homes.',
    keyLesson: 'The definitive textbook case proving that distant ice avalanches can trigger moraine collapse without prior warning or direct rainfall.',
    badgeColor: 'border-primary/40 text-primary bg-primary/10',
  },
]

interface SensorChannel {
  name: string
  provider: string
  type: string
  cadence: string
  operationalRole: string
  status: 'Production' | 'Live Sensor' | 'Archive'
}

const SENSOR_CHANNELS: SensorChannel[] = [
  {
    name: 'Copernicus Sentinel-2 MSI L2A',
    provider: 'ESA / European Commission',
    type: 'Multi-Spectral Optical (10m resolution)',
    cadence: '5 days (twin constellation)',
    operationalRole: 'High-resolution NDWI water delineation, perimeter extraction, and expansion rate tracking.',
    status: 'Live Sensor',
  },
  {
    name: 'Bhoonidhi EOS-04 (RISAT-1A)',
    provider: 'ISRO / NRSC',
    type: 'C-Band Synthetic Aperture Radar (SAR)',
    cadence: 'Periodic passes (All-weather)',
    operationalRole: 'Penetrates dense Himalayan cloud cover during June–September monsoon, monitoring lake surface extent.',
    status: 'Live Sensor',
  },
  {
    name: 'OpenTopography SRTM GL1 & CartoDEM',
    provider: 'NASA / USGS / ISRO',
    type: '30m Digital Elevation Model (DEM)',
    cadence: 'Static Topography Baseline',
    operationalRole: 'D8 hydraulic flow-routing, outlet slope calculation, and downstream village reach vulnerability matrices.',
    status: 'Production',
  },
  {
    name: 'Open-Meteo ERA5 Reanalysis & Forecast',
    provider: 'ECMWF / Open-Meteo API',
    type: 'Gridded Atmospheric Meteorological Telemetry',
    cadence: 'Hourly updates & 7-day sliding window',
    operationalRole: 'Tracks 24h precipitation pulses, freezing-level altitude (0°C isotherm), and temperature anomalies.',
    status: 'Live Sensor',
  },
  {
    name: 'USGS FDSN Global Seismology',
    provider: 'USGS Earthquake Hazards Program',
    type: 'Real-time Seismic Event API',
    cadence: 'Event-driven (Seconds latency)',
    operationalRole: 'Detects magnitude 4.0+ quakes within 100 km radius of glacial dams to trigger seismic stability re-evaluations.',
    status: 'Live Sensor',
  },
]

export function ResourcesPage() {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false)
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string>('all')
  const [copied, setCopied] = useState(false)

  const filteredTaxonomies = useMemo(() => {
    if (selectedTaxonomy === 'all') return LAKE_TAXONOMIES
    return LAKE_TAXONOMIES.filter((t) => t.id === selectedTaxonomy)
  }, [selectedTaxonomy])

  const handleCopy = () => {
    navigator.clipboard.writeText(informationMd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppShell mainClassName="min-h-0 flex-1 overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 bg-grid" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 md:py-10">
        {/* Header with Title & Source Toggle */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-outline-variant/20 pb-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-sm">menu_book</span>
              Operational Scientific Primer
            </div>
            <h1 className="mt-1 font-headline text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
              Glacial Lake & <span className="text-primary">GLOF Science Hub</span>
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
              Comprehensive scientific framing, taxonomy, compound disaster cascade models, and remote sensing telemetry
              architecture powering the GlacierGuard early warning engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRawMarkdown(!showRawMarkdown)}
              className={`flex items-center gap-2 rounded-md border px-3.5 py-2 font-mono text-xs transition-all ${
                showRawMarkdown
                  ? 'border-primary bg-primary text-on-primary font-bold shadow-md'
                  : 'border-outline-variant/30 bg-surface-container-high text-on-surface hover:bg-surface-bright'
              }`}
            >
              <span className="material-symbols-outlined text-sm" aria-hidden>
                {showRawMarkdown ? 'view_quilt' : 'terminal'}
              </span>
              {showRawMarkdown ? 'Interactive Hub' : 'Inspect Raw Markdown'}
            </button>
          </div>
        </div>

        {/* Modal / Inline View: Raw Markdown Inspection */}
        {showRawMarkdown ? (
          <div className="space-y-4 rounded-xl border border-outline-variant/20 bg-surface-container p-6">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs text-primary">
                <span className="material-symbols-outlined text-sm">description</span>
                resources/information.md (Source Document)
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded bg-surface-container-high px-2.5 py-1 font-mono text-xs text-on-surface transition-colors hover:bg-surface-bright"
              >
                <span className="material-symbols-outlined text-xs">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <pre className="max-h-[70vh] overflow-x-auto overflow-y-auto rounded-lg bg-surface-container-lowest p-4 font-mono text-[11px] leading-relaxed text-on-surface-variant whitespace-pre-wrap md:text-xs">
              {informationMd.trim()}
            </pre>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Section 1: Lake Taxonomy */}
            <section className="space-y-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <SectionLabel className="text-primary tracking-widest">Classification & Geomorphology</SectionLabel>
                  <h2 className="font-headline text-xl font-bold text-on-surface">1. Himalayan Glacial Lake Taxonomy</h2>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {['all', 'moraine', 'ice', 'bedrock', 'hybrid'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedTaxonomy(tab)}
                      className={`rounded px-2.5 py-1 text-xs transition-all ${
                        selectedTaxonomy === tab
                          ? 'bg-primary-container font-bold text-on-primary-container shadow-sm'
                          : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {tab === 'all' ? 'All Types' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredTaxonomies.map((item) => (
                  <Card
                    key={item.id}
                    variant="panel"
                    ghostBorder
                    className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:bg-surface-container-high"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-headline text-lg font-bold text-on-surface">{item.name}</h3>
                          <p className="font-mono text-xs text-on-surface-variant">{item.damType}</p>
                        </div>
                        <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${item.stabilityColor}`}>
                          {item.stability}
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-outline-variant/15 pt-3 space-y-2">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-outline">
                          Primary Failure Modes:
                        </span>
                        <ul className="mt-1 space-y-0.5 font-mono text-xs text-primary">
                          {item.failureModes.map((mode, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {mode}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded bg-surface-container-lowest/80 p-2 font-mono text-[10px] text-on-surface-variant">
                        <span className="font-bold text-on-surface">HKH Context: </span>
                        {item.hkhPrevalence}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Section 2: Mechanics & Compound Cascade */}
            <section className="space-y-4">
              <div>
                <SectionLabel className="text-primary tracking-widest">Physics & Failure Mechanics</SectionLabel>
                <h2 className="font-headline text-xl font-bold text-on-surface">2. Hazard Dynamics & Compound Cascade</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card variant="panel" ghostBorder className="p-5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary">
                    <span className="material-symbols-outlined text-base">water_drop</span>
                    Hydrostatic Pressure & Storage
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                    GLOF intensity is governed by the volume of stored water and potential energy relative to downstream
                    gradient. High hydrostatic heads exert severe shear stresses on unconsolidated terminal moraines.
                  </p>
                  <div className="mt-3 rounded bg-surface-container-lowest p-2 font-mono text-[10px] text-outline">
                    Governing metric: V × (Δh / L) energy gradient
                  </div>
                </Card>

                <Card variant="panel" ghostBorder className="p-5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#ffb74d]">
                    <span className="material-symbols-outlined text-base">tsunami</span>
                    Displacement Waves & Seiches
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                    Hanging ice or rockfall avalanches plunging into glacial lakes generate high-velocity displacement waves
                    (tsunami-like seiches). Wave heights routinely exceed the freeboard, overtopping and incising moraine dams.
                  </p>
                  <div className="mt-3 rounded bg-surface-container-lowest p-2 font-mono text-[10px] text-outline">
                    Primary trigger in ~70% of historical breaches
                  </div>
                </Card>

                <Card variant="panel" ghostBorder className="p-5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-error">
                    <span className="material-symbols-outlined text-base">emergency_heat</span>
                    Sediment Bulking & Cascades
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                    In steep gorges, outburst surges entrain enormous volumes of glacial debris, rocks, and mud. Water volume
                    amplifies by 200–300% as a hyper-concentrated debris flow, scouring downstream infrastructure.
                  </p>
                  <div className="mt-3 rounded bg-surface-container-lowest p-2 font-mono text-[10px] text-outline">
                    Compound destructive load on bridges & dams
                  </div>
                </Card>
              </div>
            </section>

            {/* Section 3: Sensor Fusion Matrix */}
            <section className="space-y-4">
              <div>
                <SectionLabel className="text-primary tracking-widest">Multi-Sensor Telemetry</SectionLabel>
                <h2 className="font-headline text-xl font-bold text-on-surface">3. Sensor Fusion Pipeline & Observability</h2>
              </div>

              <div className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-outline-variant/20 bg-surface-container-high/60 text-[10px] uppercase tracking-wider text-primary">
                        <th className="px-4 py-3">Sensor Channel / Platform</th>
                        <th className="px-4 py-3">Provider</th>
                        <th className="px-4 py-3">Data Type & Resolution</th>
                        <th className="px-4 py-3">Operational Role</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {SENSOR_CHANNELS.map((ch, idx) => (
                        <tr key={idx} className="transition-colors hover:bg-surface-container-high/40">
                          <td className="px-4 py-3 font-bold text-on-surface">{ch.name}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{ch.provider}</td>
                          <td className="px-4 py-3 text-on-surface-variant">
                            <div>{ch.type}</div>
                            <div className="text-[10px] text-outline">Cadence: {ch.cadence}</div>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant">{ch.operationalRole}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              {ch.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 4: Documented Himalayan Case Studies */}
            <section className="space-y-4">
              <div>
                <SectionLabel className="text-primary tracking-widest">Historical Evidence & Ground Truth</SectionLabel>
                <h2 className="font-headline text-xl font-bold text-on-surface">4. Benchmark Himalayan GLOF Case Studies</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {CASE_STUDIES.map((cs) => (
                  <Card key={cs.id} variant="panel" ghostBorder className="flex flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${cs.badgeColor}`}>
                          {cs.year}
                        </span>
                        <span className="font-mono text-[10px] text-outline">{cs.location}</span>
                      </div>
                      <h3 className="mt-2 font-headline text-base font-bold text-on-surface">{cs.title}</h3>
                      <div className="mt-3 space-y-2 text-xs text-on-surface-variant">
                        <div>
                          <span className="font-mono text-[10px] font-bold uppercase text-primary">Trigger Mechanism: </span>
                          {cs.trigger}
                        </div>
                        <div>
                          <span className="font-mono text-[10px] font-bold uppercase text-error">Impact & Destruction: </span>
                          {cs.impact}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-3 font-mono text-[11px] text-on-surface-variant">
                      <span className="font-bold text-on-surface">System Takeaway: </span>
                      {cs.keyLesson}
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Section 5: Agency Directives & Governance */}
            <section className="space-y-4">
              <div>
                <SectionLabel className="text-primary tracking-widest">Governance & Standard Operating Procedures</SectionLabel>
                <h2 className="font-headline text-xl font-bold text-on-surface">5. Institutional Directives & Bibliographic Sources</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card variant="panel" ghostBorder className="p-5 space-y-3">
                  <h3 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">assured_workload</span>
                    Key Disaster & Monitoring Bodies
                  </h3>
                  <ul className="space-y-2 font-mono text-xs text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">ICIMOD:</span>
                      <span>Regional Hindu Kush Himalaya inventories and glacial lake atlas methodology.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">ISRO / SAC:</span>
                      <span>Space Applications Centre Himalayan Glacial Lake monitoring & BHOONIDHI satellite archives.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">NDMA (India):</span>
                      <span>National Disaster Management Guidelines for Management of Glacial Lake Outburst Floods.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">CWC:</span>
                      <span>Central Water Commission inflow forecasting and downstream gauge station telemetry.</span>
                    </li>
                  </ul>
                </Card>

                <Card variant="panel" ghostBorder className="p-5 space-y-3">
                  <h3 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">auto_stories</span>
                    Foundational Scientific References
                  </h3>
                  <ul className="space-y-2 text-xs text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-primary font-bold">1.</span>
                      <span>
                        <strong>IPCC SROCC (2019):</strong> Special Report on the Ocean and Cryosphere in a Changing Climate — High Mountain Cryosphere chapters.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-primary font-bold">2.</span>
                      <span>
                        <strong>Lundberg & Lee (NeurIPS 2017):</strong> Unified Approach to Interpreting Model Predictions (SHAP values powering GlacierGuard explainability).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-primary font-bold">3.</span>
                      <span>
                        <strong>AntarcticGlaciers.org:</strong> Introduction to Glacial Lakes — impoundment typology and hydrostatic trigger principles.
                      </span>
                    </li>
                  </ul>
                </Card>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  )
}
