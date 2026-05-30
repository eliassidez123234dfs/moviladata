import { useEffect, useMemo, useState } from 'react'
import MapWrapper from './MapComponent'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import { getAccidents } from '../services/api'

function HeatLayer({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const heat = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 17 })
    heat.addTo(map)
    return () => { map.removeLayer(heat) }
  }, [map, points])
  return null
}

export default function HeatmapAccidents() {
  const [features, setFeatures] = useState([])
  const [selectedComuna, setSelectedComuna] = useState('Todas')

  useEffect(() => {
    getAccidents().then((data) => setFeatures(data.features || [])).catch(() => {})
  }, [])

  const comunas = useMemo(() => {
    const set = new Set(features.map((feature) => feature.properties?.comuna || 'Sin comuna'))
    return ['Todas', ...Array.from(set).filter(Boolean)]
  }, [features])

  const filtered = useMemo(() => {
    if (selectedComuna === 'Todas') return features
    return features.filter((feature) => feature.properties?.comuna === selectedComuna)
  }, [features, selectedComuna])

  const points = filtered.map((feature) => [
    feature.geometry.coordinates[1],
    feature.geometry.coordinates[0],
    0.5
  ])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Heatmap de Accidentes</h2>
          <p className="text-sm text-slate-600">Visualiza la concentración histórica de incidentes sobre Medellín.</p>
        </div>
        <label className="text-sm text-slate-700">
          Comuna
          <select
            value={selectedComuna}
            onChange={(e) => setSelectedComuna(e.target.value)}
            className="ml-2 rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
          >
            {comunas.map((comuna) => (
              <option key={comuna} value={comuna}>{comuna}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Accidentes mostrados</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{filtered.length}</p>
          </div>
          <MapWrapper>
            <HeatLayer points={points} />
          </MapWrapper>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Información</p>
          <p className="text-sm leading-6 text-slate-700">Los datos se obtienen de la capa de accidentes cargada en el backend. Ajusta la comuna para reducir el área de análisis.</p>
        </div>
      </div>
    </section>
  )
}
