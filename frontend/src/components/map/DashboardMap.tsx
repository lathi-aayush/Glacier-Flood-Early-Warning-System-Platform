import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Lake } from '@/types/lake'
import 'leaflet/dist/leaflet.css'

const CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

function MapFocus({ lake }: { lake: Lake }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lake.lat, lake.lng], 8, { duration: 0.6 })
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

  return (
    <MapContainer
      center={center}
      zoom={7}
      className="h-full w-full z-0"
      scrollWheelZoom
      attributionControl
    >
      <TileLayer attribution="&copy; OpenStreetMap &copy; CARTO" url={CARTO_DARK} />
      <MapFocus lake={selected} />
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
              fillOpacity: isSel ? 0.95 : 0.65,
              weight: isSel ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onSelectLake(lake.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95} permanent={false}>
              <span className="font-headline text-xs">{lake.name}</span>
              <span className="block font-mono text-[10px]">RISK {Math.round(lake.riskScore)}</span>
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
