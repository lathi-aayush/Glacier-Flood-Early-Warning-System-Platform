import { useEffect } from 'react'
import { MapContainer, Polyline, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

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
}

/** Mock downstream path as offsets from lake (degrees) */
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

export function ReplayMap({ lakeLat, lakeLng, pathOpacity }: ReplayMapProps) {
  const positions = absPath(lakeLat, lakeLng)
  return (
    <MapContainer
      center={[lakeLat, lakeLng]}
      zoom={9}
      className="h-full w-full z-0"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer attribution="&copy; OpenStreetMap &copy; CARTO" url={CARTO_DARK} />
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
