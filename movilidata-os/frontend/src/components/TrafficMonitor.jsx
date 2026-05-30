import { useEffect, useState } from 'react'
import { getTraffic, exportModule } from '../services/api'

export default function TrafficMonitor() {
  const [data, setData] = useState({ segments: [], source_status: 'unknown', source: 'cargando' })
  const [error, setError] = useState('')

  useEffect(() => {
    const load = () => {
      getTraffic().then((result) => {
        setData(result)
      }).catch(() => {
        setError('No se pudo cargar el tráfico.')
      })
    }
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Monitoreo de Tráfico</h2>
          <p className="text-sm text-slate-600">Actualizado cada 30 segundos con estado de incidentes y velocidad.</p>
        </div>
        <button
          type="button"
          onClick={() => exportModule('traffic')}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Exportar CSV
        </button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="mb-4 flex flex-wrap gap-3 text-sm text-slate-600">
        <span>Fuente: {data.source ?? 'desconocida'}</span>
        <span>Estado: {data.source_status ?? 'desconocido'}</span>
      </div>

      <div className="space-y-3">
        {data.segments.map((segment) => (
          <div key={segment.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-slate-900">{segment.name}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${segment.color === 'red' ? 'bg-rose-100 text-rose-700' : segment.color === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {segment.color}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-700">
              <span>Velocidad: {segment.velocidad} km/h</span>
              <span>Incidentes: {segment.incidents ?? 0}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
