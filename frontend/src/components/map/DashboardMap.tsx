import { useEffect, useState, useMemo } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, Popup, Polygon, Polyline, useMap } from 'react-leaflet'
import type { Lake } from '@/types/lake'
import { fetchLakeFloodPath, type LakeFloodPathGeoJson } from '@/api/lakesApi'
import 'leaflet/dist/leaflet.css'

const ESRI_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const CARTO_LABELS = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png'

function MapFocus({ lake }: { lake: Lake }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lake.lat, lake.lng], 8.5, { duration: 0.6 })
  }, [map, lake.lat, lake.lng])
  return null
}

function tierColor(tier: Lake['tier']): string {
  switch (tier) {
    case 'critical':
      return '#ffb4ab'
    case 'high':
      return '#9adbff'
    case 'advisory':
      return '#adc8f5'
    default:
      return '#bdc8d0'
  }
}

type DashboardMapProps = {
  lakes: Lake[]
  selectedId: string
  onSelectLake: (id: string) => void
}

export function DashboardMap({ lakes, selectedId, onSelectLake }: DashboardMapProps) {
  const selected = lakes.find((l) => l.id === selectedId) ?? lakes[0]!
  const center: [number, number] = [selected.lat, selected.lng]

  // Layer visibility toggles
  const [showFloodPath, setShowFloodPath] = useState(true)
  const [showLakePolygon, setShowLakePolygon] = useState(true)
  const [showSettlements, setShowSettlements] = useState(true)

  // GeoJSON data state
  const [geoData, setGeoData] = useState<LakeFloodPathGeoJson | null>(null)

  useEffect(() => {
    let active = true
    fetchLakeFloodPath(selectedId).then((res) => {
      if (active) setGeoData(res)
    })
    return () => {
      active = false
    }
  }, [selectedId])

  // Extract parsed features from GeoJSON
  const { lakePolygonCoords, floodPathCoords, settlements, floodPathProps } = useMemo(() => {
    if (!geoData || !geoData.features) {
      return { lakePolygonCoords: null, floodPathCoords: null, settlements: [], floodPathProps: null }
    }

    let poly: [number, number][] | null = null
    let line: [number, number][] | null = null
    const stList: any[] = []
    let pathProps: any = null

    for (const f of geoData.features) {
      if (f.geometry.type === 'Polygon') {
        const rawCoords = f.geometry.coordinates[0] as [number, number][]
        if (rawCoords) {
          poly = rawCoords.map(([lng, lat]) => [lat, lng])
        }
      } else if (f.geometry.type === 'LineString') {
        const rawCoords = f.geometry.coordinates as [number, number][]
        if (rawCoords) {
          line = rawCoords.map(([lng, lat]) => [lat, lng])
        }
        pathProps = f.properties
      } else if (f.geometry.type === 'Point' && f.properties.feature_type === 'settlement') {
        const [lng, lat] = f.geometry.coordinates as [number, number]
        stList.push({
          id: f.id,
          coords: [lat, lng] as [number, number],
          ...(f.properties as any),
        })
      }
    }

    return {
      lakePolygonCoords: poly,
      floodPathCoords: line,
      settlements: stList,
      floodPathProps: pathProps,
    }
  }, [geoData])

  return (
    <div className="relative h-full w-full">
      {/* Floating Layer Controls (Top-Left) */}
      <div className="absolute left-4 top-4 z-[1000] flex flex-col gap-2 rounded-xl border border-slate-700/80 bg-slate-950/85 p-3 backdrop-blur-md text-xs font-mono shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
          <span className="font-bold uppercase tracking-wider text-cyan-400 text-[10px]">Map GIS Layers</span>
          {floodPathProps && (
            <span className="text-[10px] text-slate-400 font-mono">
              Q<sub>peak</sub>: {floodPathProps.peak_discharge_m3_s} m³/s
            </span>
          )}
        </div>

        <div className="space-y-1.5 pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-cyan-300 transition-colors">
            <input
              type="checkbox"
              checked={showFloodPath}
              onChange={(e) => setShowFloodPath(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900 cursor-pointer"
            />
            <span className="text-[11px] flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-500 rounded inline-block" />
              <span>D8 Flood Inundation Path</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-cyan-300 transition-colors">
            <input
              type="checkbox"
              checked={showLakePolygon}
              onChange={(e) => setShowLakePolygon(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900 cursor-pointer"
            />
            <span className="text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 bg-sky-500/80 border border-sky-400 rounded-sm inline-block" />
              <span>Lake Water Surface Boundary</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-cyan-300 transition-colors">
            <input
              type="checkbox"
              checked={showSettlements}
              onChange={(e) => setShowSettlements(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900 cursor-pointer"
            />
            <span className="text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>Downstream Settlements & Dams</span>
            </span>
          </label>
        </div>

        {floodPathProps && (
          <div className="mt-1 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Corridor: {floodPathProps.total_distance_km} km</span>
            <span>Drop: {floodPathProps.total_drop_m} m</span>
          </div>
        )}
      </div>

      {/* Sensor Layer Badge (Bottom-Left) */}
      <div className="pointer-events-none absolute left-4 bottom-6 z-[1000] flex items-center gap-2 rounded border border-outline-variant/30 bg-surface-container-lowest/85 px-2.5 py-1 backdrop-blur-md text-[11px] font-mono text-outline shadow-sm">
        <svg
          className="h-3.5 w-3.5 text-primary shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M13 2 L22 11" />
          <path d="M14.5 9.5 L12 12" />
          <path d="M8 12 L3 17" />
          <path d="M6 10 L10 6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
        <span className="tracking-tight text-on-surface-variant">ESRI World Imagery &bull; Sentinel-2 NDWI Overlay</span>
      </div>

      <MapContainer
        center={center}
        zoom={8}
        className="h-full w-full z-0"
        scrollWheelZoom
        attributionControl
      >
        <TileLayer
          attribution="&copy; Esri, Maxar, Earthstar Geographics"
          url={ESRI_SATELLITE}
          maxZoom={19}
        />
        <TileLayer
          attribution="&copy; CARTO"
          url={CARTO_LABELS}
          subdomains="abcd"
          maxZoom={19}
        />

        <MapFocus lake={selected} />

        {/* 1. Lake Water Surface Boundary (Polygon) */}
        {showLakePolygon && lakePolygonCoords && (
          <Polygon
            positions={lakePolygonCoords}
            pathOptions={{
              color: '#38bdf8',
              fillColor: '#0284c7',
              fillOpacity: 0.55,
              weight: 2.5,
              dashArray: '3, 3',
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div className="font-mono text-xs p-1">
                <div className="font-bold text-cyan-400">{selected.name}</div>
                <div className="text-[10px] text-slate-300">Surface Boundary (Sentinel-2/SAR)</div>
              </div>
            </Tooltip>
          </Polygon>
        )}

        {/* 2. D8 Downstream Flood Inundation Path (Polyline) */}
        {showFloodPath && floodPathCoords && (
          <>
            {/* Outer glowing halo */}
            <Polyline
              positions={floodPathCoords}
              pathOptions={{
                color: '#e11d48',
                weight: 6,
                opacity: 0.4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Inner dashed directional line */}
            <Polyline
              positions={floodPathCoords}
              pathOptions={{
                color: '#38bdf8',
                weight: 2.5,
                opacity: 0.95,
                dashArray: '8, 6',
                lineCap: 'round',
              }}
            >
              <Tooltip direction="top" opacity={0.95}>
                <div className="font-mono text-xs p-1">
                  <div className="font-bold text-rose-400">Flood Inundation Corridor</div>
                  {floodPathProps && (
                    <div className="text-[10px] text-slate-300">
                      Length: {floodPathProps.total_distance_km} km | Drop: {floodPathProps.total_drop_m} m
                    </div>
                  )}
                </div>
              </Tooltip>
            </Polyline>
          </>
        )}

        {/* 3. Downstream Settlements & Infrastructure (CircleMarkers) */}
        {showSettlements &&
          settlements.map((st) => {
            const isCritical = st.urgency === 'critical'
            const isElevated = st.urgency === 'elevated'
            const color = isCritical ? '#f43f5e' : isElevated ? '#fbbf24' : '#38bdf8'

            return (
              <CircleMarker
                key={st.id}
                center={st.coords}
                radius={isCritical ? 8 : 6}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                  <span className="font-headline text-xs font-semibold text-slate-100">
                    {st.name} ({st.eta})
                  </span>
                </Tooltip>
                <Popup>
                  <div className="font-mono text-xs p-1 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center justify-between gap-2 border-b pb-1">
                      <span>{st.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        isCritical ? 'bg-red-100 text-red-700' : isElevated ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {st.urgency}
                      </span>
                    </div>
                    <div className="text-slate-700 text-[11px]">
                      <div><strong>Pop. at Risk:</strong> {st.pop_at_risk.toLocaleString()}</div>
                      <div><strong>Flood Wave ETA:</strong> {st.eta}</div>
                      <div><strong>Elevation:</strong> {st.elev_m}m ASL</div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

        {/* 4. Monitored Glacial Lakes (CircleMarkers) */}
        {lakes.map((lake) => {
          const isSel = lake.id === selectedId
          const fill = tierColor(lake.tier)
          return (
            <CircleMarker
              key={lake.id}
              center={[lake.lat, lake.lng]}
              radius={isSel ? 14 : 9}
              pathOptions={{
                color: isSel ? '#ffdad6' : fill,
                fillColor: fill,
                fillOpacity: isSel ? 0.95 : 0.7,
                weight: isSel ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onSelectLake(lake.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95} permanent={false}>
                <span className="font-headline text-xs font-semibold">{lake.name}</span>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
