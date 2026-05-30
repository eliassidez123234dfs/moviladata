import { useEffect, useState } from 'react'
import { getAccidents, getTraffic, getWeather, getAlerts } from '../services/api'

export default function Dashboard() {
  const [accCount, setAccCount] = useState(0)
  const [trafficCount, setTrafficCount] = useState(0)
  const [weather, setWeather] = useState(null)
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    getAccidents().then((data) => setAccCount(data.features?.length ?? 0)).catch(() => {})
    getTraffic().then((data) => setTrafficCount(data.segments?.length ?? 0)).catch(() => {})
    getWeather().then((data) => setWeather(data)).catch(() => {})
    getAlerts().then((data) => setAlertCount(data.alerts?.length ?? 0)).catch(() => {})
  }, [])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Resumen rápido</h2>
          <p className="text-sm text-slate-600">Mira los indicadores clave de movilidad en Medellín.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Accidentes</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{accCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Sectores de tráfico</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{trafficCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Estado climático</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{weather?.intensidad_label ?? '---'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Alertas activas</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{alertCount}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Detalle</p>
          <p className="mt-3 text-sm text-slate-700">Fuente del clima: {weather?.fuente ?? 'cargando...'}</p>
          <p className="mt-2 text-sm text-slate-700">Tráfico estimado con estado de color: {weather?.source_status === 'degraded' ? 'degradado' : 'normal'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Acceso rápido</p>
          <p className="mt-3 text-sm text-slate-700">Navega entre datos de accidentes, tráfico, predicción, ruta segura y asistente en la pestaña seleccionada.</p>
        </div>
      </div>
    </section>
  )
}
