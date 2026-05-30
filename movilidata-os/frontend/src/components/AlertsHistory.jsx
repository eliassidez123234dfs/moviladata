import { useEffect, useState } from 'react'
import { getAlertsHistory, exportModule } from '../services/api'

export default function AlertsHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAlertsHistory()
      .then((data) => setHistory(data.history || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Historial de alertas</h2>
          <p className="text-sm text-slate-600">Registros recientes de movilidad y seguridad.</p>
        </div>
        <button
          type="button"
          onClick={() => exportModule('alerts')}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Exportar alertas
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Cargando historial...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-slate-600">No hay alertas registradas.</p>
      ) : (
        <div className="space-y-3">
          {history.map((item, index) => (
            <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
                <span>{item.tipo}</span>
                <span>{item.fecha}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{item.descripcion}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
