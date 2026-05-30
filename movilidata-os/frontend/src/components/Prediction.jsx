import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { getPrediction, exportModule } from '../services/api'

const DEFAULT_CENTER = [6.2442, -75.5812]

export default function Prediction() {
  const [prediction, setPrediction] = useState(null)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState(12)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPrediction()
  }, [])

  async function loadPrediction() {
    setLoading(true)
    setError('')
    try {
      const data = await getPrediction(fecha, hora)
      setPrediction(data)
    } catch (err) {
      setError('No se pudo obtener la predicción.')
    } finally {
      setLoading(false)
    }
  }

  const heatmapPoints = prediction?.heatmap?.features?.map((feature) => ({
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
    label: feature.properties?.zona,
    value: feature.properties?.probabilidad
  })) || []

  const averageProbability = heatmapPoints.length > 0
    ? (heatmapPoints.reduce((sum, item) => sum + item.value, 0) / heatmapPoints.length)
    : 0

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Predicción de riesgo</h2>
          <p className="text-sm text-slate-600">Proyección de riesgo con mapa de probabilidad y series horarias.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="inline-flex gap-2">
            <button
              type="button"
              onClick={loadPrediction}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Consultar
            </button>
            <button
              type="button"
              onClick={() => exportModule('prediction')}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1 text-sm text-slate-700">
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          Hora
          <select
            value={hora}
            onChange={(e) => setHora(Number(e.target.value))}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
          >
            {Array.from({ length: 24 }, (_, index) => (
              <option key={index} value={index}>{index}:00</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="mt-4 text-slate-600">Cargando predicción...</p>}
      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      {prediction && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Riesgo estimado</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{(averageProbability * 100).toFixed(0)}%</p>
                <p className="text-sm text-slate-600">Probabilidad promedio de congestión sobre el mapa.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Modelo</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{prediction.model_info?.nombre ?? 'N/A'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fecha generada</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{prediction.metadata?.fecha_generacion ?? 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Fuente</h3>
              <p className="mt-2 text-sm text-slate-700">{prediction.metadata?.fuente ?? 'SIM simulado'}</p>
              <p className="mt-3 text-sm text-slate-600">Usa el resumen actual de tráfico para estimar riesgo por zona.</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold text-slate-900">Series horarias</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Histórico reciente</p>
                {prediction.series.historico.map((item) => (
                  <div key={item.hora} className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-700">
                    <p>{item.hora}</p>
                    <p className="font-semibold">{(item.valor * 100).toFixed(0)}%</p>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pronóstico</p>
                {prediction.series.pronostico.map((item) => (
                  <div key={item.hora} className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-700">
                    <p>{item.hora}</p>
                    <p className="font-semibold">{(item.probabilidad * 100).toFixed(0)}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {heatmapPoints.length > 0 && (
            <div className="mt-6 h-80 overflow-hidden rounded-3xl border border-slate-200">
              <MapContainer center={DEFAULT_CENTER} zoom={12} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {heatmapPoints.map((point, index) => (
                  <Marker key={index} position={[point.lat, point.lng]}>
                    <Popup>
                      {point.label}<br />Probabilidad: {(point.value * 100).toFixed(0)}%
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </>
      )}
    </section>
  )
}
