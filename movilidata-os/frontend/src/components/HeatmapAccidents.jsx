import { useEffect, useMemo, useState, useCallback } from 'react'
import MapWrapper from './MapComponent'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { getAccidents } from '../services/api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import MetricCard from './MetricCard'

const STORAGE_KEY = 'movilidata_accident_filters'
function saveFilters(f) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(f)) } catch {} }
function loadFilters() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} } }

const ChartTooltip = {
  contentStyle: { borderRadius: 8, border: '1px solid #30363D', backgroundColor: '#161B22', color: '#C9D1D9', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }
}

function HeatLayer({ points, features }) {
  const map = useMap()
  useEffect(() => {
    if (!map || points.length === 0) return
    const showHeat = features.length < 2000
    let heat, cluster
    if (showHeat) {
      heat = L.heatLayer(points, { radius: 22, blur: 12, maxZoom: 16, max: 0.8, gradient: { 0.2: '#3FB950', 0.4: '#D29922', 0.6: '#F78166', 0.8: '#F85149', 1.0: '#DA3633' } })
      heat.addTo(map)
    } else {
      cluster = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50, spiderfyOnMaxZoom: true, showCoverageOnHover: false, zoomToBoundsOnClick: true })
      features.forEach((f) => {
        const coords = f.geometry?.coordinates; if (!coords) return
        const p = f.properties || {}
        const color = p.gravedad === 3 ? '#F85149' : p.gravedad === 2 ? '#D29922' : '#3FB950'
        const marker = L.marker([coords[1], coords[0]], {
          icon: L.divIcon({ className: '', html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;opacity:0.85"></div>`, iconSize: [10, 10], iconAnchor: [5, 5] })
        })
        marker.bindPopup(`<strong>${p.comuna || 'Sin comuna'}</strong><br/>${p.tipo || 'N/A'}<br/>${p.fecha || ''}<br/>Gravedad: ${p.gravedad === 3 ? 'Grave' : p.gravedad === 2 ? 'Moderado' : 'Leve'}`)
        cluster.addLayer(marker)
      })
      map.addLayer(cluster)
    }
    return () => { if (heat) map.removeLayer(heat); if (cluster) map.removeLayer(cluster) }
  }, [map, points, features])
  return null
}

export default function HeatmapAccidents({ openDetail }) {
  const saved = loadFilters()
  const [features, setFeatures] = useState([])
  const [selectedComuna, setSelectedComuna] = useState(saved.comuna || 'Todas')
  const [selectedType, setSelectedType] = useState(saved.tipo || 'Todos')
  const [selectedSeverity, setSelectedSeverity] = useState(saved.gravedad || 'Todas')
  const [selectedYear, setSelectedYear] = useState(saved.anio || 'Todos')
  const [showFilters, setShowFilters] = useState(false)

  const persistFilters = useCallback((u) => saveFilters({ ...loadFilters(), ...u }), [])

  useEffect(() => { getAccidents().then((d) => setFeatures(d.features || [])).catch(() => {}) }, [])

  const { comunas, types, years } = useMemo(() => {
    const cS = new Set(); const tS = new Set(); const yS = new Set()
    features.forEach((f) => { const p = f.properties || {}; if (p.comuna) cS.add(p.comuna); if (p.tipo) tS.add(p.tipo); if (p.fecha) yS.add(p.fecha.split('-')[0]) })
    return { comunas: ['Todas', ...cS].filter(Boolean), types: ['Todos', ...tS].filter(Boolean), years: ['Todos', ...yS].filter(Boolean).sort() }
  }, [features])

  const filtered = useMemo(() => features.filter((f) => {
    const p = f.properties || {}
    if (selectedComuna !== 'Todas' && p.comuna !== selectedComuna) return false
    if (selectedType !== 'Todos' && p.tipo !== selectedType) return false
    if (selectedSeverity !== 'Todas' && String(p.gravedad) !== selectedSeverity) return false
    if (selectedYear !== 'Todos' && p.fecha?.startsWith(selectedYear) === false) return false
    return true
  }), [features, selectedComuna, selectedType, selectedSeverity, selectedYear])

  useEffect(() => { persistFilters({ comuna: selectedComuna, tipo: selectedType, gravedad: selectedSeverity, anio: selectedYear }) }, [selectedComuna, selectedType, selectedSeverity, selectedYear, persistFilters])

  const points = filtered.filter((f) => f.geometry?.coordinates).map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0], 0.5])

  const barData = useMemo(() => {
    const counts = {}
    filtered.forEach((f) => { const c = f.properties?.comuna || 'Sin comuna'; counts[c] = (counts[c] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, v]) => ({ comuna: c, accidentes: v }))
  }, [filtered])

  const lineData = useMemo(() => {
    const counts = {}
    filtered.forEach((f) => { const d = f.properties?.fecha; if (!d) return; const k = d.substring(0, 7); counts[k] = (counts[k] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).slice(-24).map(([m, v]) => ({ mes: m, accidentes: v }))
  }, [filtered])

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#C9D1D9' }}>Mapa de accidentes</h2>
          <p className="text-sm" style={{ color: '#8B949E' }}>Incidentes de tránsito en Medellín</p>
        </div>
        <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn-secondary text-sm">
          <svg className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {showFilters ? 'Ocultar filtros' : 'Filtrar'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Incidentes visibles" value={filtered.length} unit={filtered.length !== features.length ? `de ${features.length}` : ''} color="red" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        <MetricCard label="Comunas afectadas" value={barData.length} color="yellow" icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <MetricCard label="Tipo frecuente" value={types[1] || '---'} color="blue" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#30363D' }}>
          <MapWrapper height={360}>
            <HeatLayer points={points} features={filtered} />
          </MapWrapper>
          <div className="flex items-center gap-4 px-4 py-2 text-xs" style={{ backgroundColor: '#0D1117', borderTop: '1px solid #30363D' }}>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#3FB950' }} /> Leve</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#D29922' }} /> Moderado</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#F85149' }} /> Grave</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Top zonas</h3>
              <p className="text-xs" style={{ color: '#8B949E' }}>Comunas con más accidentes</p>
            </div>
            <div className="card-body max-h-[360px] overflow-y-auto">
              {barData.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#6E7681' }}>Sin datos</p>
              ) : (
                <div className="space-y-0.5">
                  {barData.slice(0, 6).map((item, i) => (
                    <button key={item.comuna} type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors"
                      style={{ color: '#C9D1D9' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(88, 166, 255, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => openDetail && openDetail(item.comuna, (
                        <div className="space-y-3">
                          <div className="rounded-lg p-4" style={{ backgroundColor: '#0D1117' }}>
                            <p className="text-xs uppercase tracking-wider" style={{ color: '#6E7681' }}>Comuna</p>
                            <p className="text-lg font-semibold mt-1" style={{ color: '#C9D1D9' }}>{item.comuna}</p>
                          </div>
                          <div className="rounded-lg p-4" style={{ backgroundColor: '#0D1117' }}>
                            <p className="text-xs uppercase tracking-wider" style={{ color: '#6E7681' }}>Accidentes</p>
                            <p className="text-2xl font-bold mt-1" style={{ color: '#F85149' }}>{item.accidentes}</p>
                          </div>
                        </div>
                      ))}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold"
                        style={{ backgroundColor: i === 0 ? 'rgba(248,81,73,0.15)' : i === 1 ? 'rgba(210,153,34,0.15)' : i === 2 ? 'rgba(88,166,255,0.15)' : 'rgba(255,255,255,0.04)', color: i === 0 ? '#F85149' : i === 1 ? '#D29922' : i === 2 ? '#58A6FF' : '#8B949E' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate" style={{ color: '#C9D1D9' }}>{item.comuna}</p>
                        <p className="text-2xs" style={{ color: '#6E7681' }}>{item.accidentes} incidentes</p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: '#F85149' }}>{item.accidentes}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <p className="text-xs uppercase tracking-wider" style={{ color: '#6E7681' }}>Fuente</p>
              <p className="text-sm mt-1" style={{ color: '#8B949E' }}>ArcGIS Medellín · Open-Meteo · OSRM</p>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="card p-4 animate-slide-down">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block"><span className="label text-xs">Comuna</span>
              <select value={selectedComuna} onChange={(e) => setSelectedComuna(e.target.value)} className="select mt-1">
                {comunas.map((c) => <option key={c} value={c}>{c}</option>)}
              </select></label>
            <label className="block"><span className="label text-xs">Tipo</span>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="select mt-1">
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select></label>
            <label className="block"><span className="label text-xs">Gravedad</span>
              <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)} className="select mt-1">
                <option value="Todas">Todas</option>
                <option value="1">Leve</option><option value="2">Moderada</option><option value="3">Grave</option>
              </select></label>
            <label className="block"><span className="label text-xs">Año</span>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="select mt-1">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select></label>
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={() => { setSelectedComuna('Todas'); setSelectedType('Todos'); setSelectedSeverity('Todas'); setSelectedYear('Todos') }}
              className="btn-ghost text-xs">Limpiar filtros</button>
          </div>
        </div>
      )}

      {barData.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Accidentes por comuna</h3>
              <p className="text-xs" style={{ color: '#8B949E' }}>Top 10 comunas</p>
            </div>
            <div className="card-body">
              <div style={{ height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                    <XAxis dataKey="comuna" tick={{ fontSize: 10, fill: '#8B949E' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B949E' }} />
                    <Tooltip {...ChartTooltip} />
                    <Bar dataKey="accidentes" fill="#F85149" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Tendencia temporal</h3>
              <p className="text-xs" style={{ color: '#8B949E' }}>Evolución mensual</p>
            </div>
            <div className="card-body">
              <div style={{ height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={lineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#8B949E' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B949E' }} />
                    <Tooltip {...ChartTooltip} />
                    <Line type="monotone" dataKey="accidentes" stroke="#58A6FF" strokeWidth={2} dot={{ r: 3, fill: '#58A6FF' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
