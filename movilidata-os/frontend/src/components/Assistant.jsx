import { useState } from 'react'
import { sendAssistant } from '../services/api'

export default function Assistant() {
  const [query, setQuery] = useState('')
  const [chat, setChat] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!query.trim()) return

    const message = { role: 'user', text: query.trim() }
    setChat((current) => [...current, message])
    setQuery('')
    setLoading(true)
    setError('')

    try {
      const response = await sendAssistant(query.trim())
      setChat((current) => [...current, { role: 'assistant', text: response.respuesta, metadata: response }])
    } catch (err) {
      setError('Error al enviar la consulta. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Asistente de seguridad</h2>
          <p className="text-sm text-slate-600">Consulta datos, alertas y recomendaciones de movilidad.</p>
        </div>
        {chat.length > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Mensajes: {chat.length}</span>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p>Escribe una pregunta como:</p>
          <ul className="list-disc pl-5">
            <li>¿Dónde hay mayor riesgo de accidentes hoy?</li>
            <li>¿Cuál es la mejor ruta más segura hacia el centro?</li>
            <li>¿Qué alertas hoy afectan el tránsito?</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            placeholder="Escribe tu pregunta aquí"
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Consultando...' : 'Enviar'}
            </button>
            {error && <span className="text-sm text-rose-600">{error}</span>}
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          {chat.length === 0 ? (
            <p className="text-sm text-slate-600">No hay respuestas todavía.</p>
          ) : (
            <div className="space-y-3">
              {chat.map((item, index) => (
                <div key={index} className={item.role === 'user' ? 'rounded-xl bg-slate-100 p-3' : 'rounded-xl bg-slate-900 p-3 text-white'}>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.role === 'user' ? 'Tú' : 'Sistema'}</p>
                  <p className="mt-2 whitespace-pre-line text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
