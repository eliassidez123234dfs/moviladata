import { useEffect, useState } from 'react'
import { getTraffic, exportModule } from '../services/api'
import MapWrapper from './MapComponent'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import MetricCard from './MetricCard'

const segmentCoords = {
  'Vía 1': [6.2442, -75.5812], 'Vía 2': [6.2300, -75.5900],
  'Vía 3': [6.2600, -75.5700], 'Vía 4': [6.2150, -75.5950],
  'Vía 5': [6.2500, -75.5600], 'Vía 6': [6.2700, -75.5850],
  'Vía 7': [6.2000, -75.5750], 'Vía 8': [6.2350, -75.5650]
}

const ROUTE_NAMES = {
  'Vía 1': 'Autopista Sur', 'Vía 2': 'Av. El Poblado',
  'Vía 3': 'Av. San Juan', 'Vía 4': 'Av. 33',
  'Vía 5': 'Av. Oriental', 'Vía 6': 'Av. 80',
  'Vía 7': 'Av. Las Vegas', 'Vía 8': 'Av. Guayabal'
}

const STATUS = {
  green: { label: 'Fluido', speed: '> 35 km/h', color: '#3FB950' },
  yellow: { label: 'Moderado', speed: '20-35 km/h', color: '#D29922' },
  red: { label: 'Congestionado', speed: '< 20 km/h', color: '#F85149' }
}

function TrafficMapMarkers({ segments }) {
  const map = useMap()
  useEffect(() => {
    if (!map || segments.length === 0) return
    const markers = segments.map((seg) => {
      const pos = segmentCoords[seg.name] || [6.24, -75.58]
      const s = STATUS[seg.color] || STATUS.green
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${s.color};border:2px solid white"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
      })
      return L.marker(pos, { icon })
        .bindPopup(`<strong>${ROUTE_NAMES[seg.name] || seg.name}</strong><br/>${s.label}<br/>${seg.velocidad} km/h`)
    })
    markers.forEach((m) => m.addTo(map))
    return () => markers.forEach((m) => map.removeLayer(m))
  }, [map, segments])
  return null
}

export default function TrafficMonitor() {
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getTraffic().then((data) => setSegments(data.segments || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const counts = { green: 0, yellow: 0, red: 0 }
  segments.forEach((s) => { if (counts[s.color] !== undefined) counts[s.color]++ })

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#C9D1D9' }}>Estado del tráfico</h2>
          <p className="text-sm" style={{ color: '#8B949E' }}>Monitoreo de vías principales en Medellín</p>
        </div>
        <button type="button" onClick={async () => { setExporting(true); try { await exportModule('traffic') } catch {}; setExporting(false) }}
          disabled={exporting || segments.length === 0} className="btn-secondary text-sm">
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <MetricCard label="Vías monitoreadas" value={segments.length} color="blue" icon="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        <MetricCard label="Fluido" value={counts.green} color="green" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <MetricCard label="Moderado" value={counts.yellow} color="yellow" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        <MetricCard label="Congestionado" value={counts.red} color="red" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#30363D' }}>
        <MapWrapper height={380}>
          <TrafficMapMarkers segments={segments} />
        </MapWrapper>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Estado por vía</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-9 rounded-lg animate-pulse" style={{ backgroundColor: '#21262D' }} />)}</div>
          ) : segments.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#6E7681' }}>No hay datos disponibles</p>
          ) : (
            <div className="space-y-0.5">
              {segments.map((seg, i) => {
                const s = STATUS[seg.color] || STATUS.green
                return (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(88, 166, 255, 0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span className="flex h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#C9D1D9' }}>{ROUTE_NAMES[seg.name] || seg.name}</p>
                      <p className="text-2xs" style={{ color: '#6E7681' }}>{s.label} · {s.speed}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: s.color }}>{seg.velocidad} km/h</p>
                      <p className="text-2xs" style={{ color: '#6E7681' }}>{seg.densidad || '-'} veh/km</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
