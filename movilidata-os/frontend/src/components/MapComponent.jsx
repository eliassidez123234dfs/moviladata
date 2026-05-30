import React, { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function MapWrapper({ children, center=[6.25,-75.57], zoom=12 }){
  return (
    <MapContainer center={center} zoom={zoom} style={{height: '400px', width: '100%'}}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {children}
    </MapContainer>
  )
}

export default MapWrapper
