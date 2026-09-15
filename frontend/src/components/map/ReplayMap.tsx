import { useEffect, useState } from 'react'
import { MapContainer, Polyline, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import { fetchLakeFloodPath } from '@/api/lakesApi'
import 'leaflet/dist/leaflet.css'

const ESRI_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const CARTO_LABELS = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png'

function MapFocus({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], 9, { duration: 0.5 })
  }, [map, lat, lng])
  return null
}

type ReplayMapProps = {
  lakeLat: number
  lakeLng: number
  pathOpacity: number
  lakeId?: string
}

/** Fallback downstream path as offsets from lake (degrees) */
const REL_PATH: [number, number][] = [
  [0, 0],
  [0.0075, -0.033],
  [-0.032, -0.103],
  [-0.092, -0.173],
  [-0.173, -0.233],
]

function absPath(lat: number, lng: number): [number, number][] {
  return REL_PATH.map(([dy, dx]) => [lat + dy, lng + dx])
}

export function ReplayMap({ lakeLat, lakeLng, pathOpacity, lakeId }: ReplayMapProps) {
  const [realPath, setRealPath] = useState<[number, number][] | null>(null)

  useEffect(() => {
    if (!lakeId) return
    let active = true
    fetchLakeFloodPath(lakeId).then((geo) => {
      if (!active || !geo) return
      const lineFeature = geo.features.find((f) => f.geometry.type === 'LineString')
      if (lineFeature) {
        const coords = lineFeature.geometry.coordinates as [number, number][]
        setRealPath(coords.map(([lng, lat]) => [lat, lng]))
      }
    })
    return () => {
      active = false
    }
  }, [lakeId])

  const positions = realPath && realPath.length > 0 ? realPath : absPath(lakeLat, lakeLng)
  return (
    <MapContainer
      center={[lakeLat, lakeLng]}
      zoom={9}
      className="h-full w-full z-0"
      scrollWheelZoom
      zoomControl={false}
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
      <MapFocus lat={lakeLat} lng={lakeLng} />
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#4fc3f7',
          weight: 10,
          opacity: pathOpacity * 0.55,
          lineCap: 'round',
        }}
      />
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#9adbff',
          weight: 3,
          opacity: pathOpacity,
          dashArray: '10 14',
          lineCap: 'round',
        }}
      />
      <CircleMarker
        center={[lakeLat, lakeLng]}
        radius={10}
        pathOptions={{
          color: '#690005',
          fillColor: '#ffb4ab',
          fillOpacity: 0.95,
          weight: 2,
        }}
      />
    </MapContainer>
  )
}
