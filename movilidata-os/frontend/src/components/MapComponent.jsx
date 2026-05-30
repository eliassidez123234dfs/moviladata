import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function MapUpdater({ center }) {
  const map = useMap()
  const prevCenter = useRef(center)
  useEffect(() => {
    if (!center || !map) return
    const [lat, lon] = center
    const [pLat, pLon] = prevCenter.current || []
    if (lat !== pLat || lon !== pLon) {
      map.setView([lat, lon], map.getZoom(), { animate: true })
      prevCenter.current = center
    }
  }, [map, center])
  return null
}

export default function MapWrapper({ children, center, zoom = 13, height = 400 }) {
  const mapCenter = center || [6.25, -75.57]

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      style={{ height: `${height}px`, width: '100%', borderRadius: '0.75rem' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
        minZoom={10}
      />
      {center && <MapUpdater center={center} />}
      {children}
    </MapContainer>
  )
}
