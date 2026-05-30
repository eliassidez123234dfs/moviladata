import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import HeatmapAccidents from './components/HeatmapAccidents'
import TrafficMonitor from './components/TrafficMonitor'
import SafeRoute from './components/SafeRoute'
import Prediction from './components/Prediction'
import Assistant from './components/Assistant'
import AlertsHistory from './components/AlertsHistory'

const sections = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'accidentes', label: 'Accidentes' },
  { id: 'trafico', label: 'Tráfico' },
  { id: 'prediccion', label: 'Predicción' },
  { id: 'rutas', label: 'Rutas' },
  { id: 'asistente', label: 'Asistente' }
]

export default function App() {
  const [active, setActive] = useState('dashboard')

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Movilidata OS</p>
          <h1 className="mt-2 text-3xl font-semibold">Medellín — Plataforma de movilidad segura</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Monitoreo en tiempo real, predicción de riesgo, alertas y rutas más seguras en una interfaz minimalista.</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${active === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="space-y-6">
        {active === 'dashboard' && (
          <div className="space-y-6">
            <Dashboard />
            <AlertsHistory />
          </div>
        )}
        {active === 'accidentes' && <HeatmapAccidents />}
        {active === 'trafico' && <TrafficMonitor />}
        {active === 'prediccion' && <Prediction />}
        {active === 'rutas' && <SafeRoute />}
        {active === 'asistente' && <Assistant />}
      </main>
    </div>
  )
}
