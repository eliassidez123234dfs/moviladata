import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapWrapper({ children, center=[6.25,-75.57], zoom=12, height=400 }){
  return (
    <MapContainer center={center} zoom={zoom} style={{height: `${height}px`, width: '100%'}}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OSM</a>'
      />
      {children}
    </MapContainer>
  )
}
