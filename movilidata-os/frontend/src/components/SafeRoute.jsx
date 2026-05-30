import { useState } from 'react'
import { sendSafeRoute } from '../services/api'

export default function SafeRoute() {
  const [origen, setOrigen] = useState('6.2445,-75.6012')
  const [destino, setDestino] = useState('6.2603,-75.5772')
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const [lat1, lon1] = origen.split(',').map(Number)
      const [lat2, lon2] = destino.split(',').map(Number)
      const result = await sendSafeRoute([lat1, lon1], [lat2, lon2])
      setRoute(result.route || result)
    } catch (err) {
      setError('No se pudo calcular la ruta segura.')
      setRoute(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Rutas Seguras</h2>
        <p className="text-sm text-slate-600">Genera una ruta sugerida basada en el estado actual de la red.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            Origen (lat,lon)
            <input
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Destino (lat,lon)
            <input
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? 'Calculando...' : 'Calcular ruta segura'}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </form>

      {route && (
        <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Ruta estimada</p>
          <p className="text-sm text-slate-700">Origen: {route.origen?.join(', ')}</p>
          <p className="text-sm text-slate-700">Destino: {route.destino?.join(', ')}</p>
          <p className="text-sm text-slate-700">Duración estimada: {route.duration ?? 'N/A'}</p>
          <p className="text-sm text-slate-700">Distancia: {route.distance ?? 'N/A'}</p>
          <pre className="overflow-auto rounded-2xl bg-white p-3 text-xs text-slate-700">{JSON.stringify(route, null, 2)}</pre>
        </div>
      )}
    </section>
  )
}
