import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toggleSidebar } from '../redux/slices/uiSlice'

export default function TopBar() {
  const dispatch = useDispatch()
  const { activeTab, darkMode, offlineMode } = useSelector((state) => state.ui)
  const { dataFreshness, lastUpdate, errors } = useSelector((state) => state.dashboard)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const searchRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (showNotifications && notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifications])

  const sections = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'accidentes', label: 'Accidentes' },
    { id: 'trafico', label: 'Tráfico' },
    { id: 'prediccion', label: 'Predicción' },
    { id: 'rutas', label: 'Rutas Seguras' },
    { id: 'asistente', label: 'Asistente' }
  ]

  const currentSection = sections.find(s => s.id === activeTab)

  const freshnessIndicators = []
  if (dataFreshness === 'degraded') {
    freshnessIndicators.push({ type: 'warning', label: 'Datos simulados' })
  }
  if (offlineMode) {
    freshnessIndicators.push({ type: 'error', label: 'Sin conexión' })
  }

  const notifications = [
    ...freshnessIndicators.map((n, i) => ({ id: `freshness-${i}`, type: n.type, title: n.label, time: lastUpdate })),
    { id: 'dashboard-update', type: 'info', title: 'Dashboard actualizado', time: lastUpdate }
  ].filter(n => n.time)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-surface-200 bg-white/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Abrir menú de navegación"
        className="md:hidden -ml-2 rounded-lg p-2 text-surface-500 hover:bg-surface-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-base font-semibold text-surface-900 truncate">
          {currentSection?.label || 'Dashboard'}
        </h1>
        {currentSection?.id !== 'dashboard' && (
          <>
            <svg className="h-4 w-4 shrink-0 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm text-surface-500 truncate">Movilidata OS</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Status indicators */}
      <div className="hidden sm:flex items-center gap-2">
        {freshnessIndicators.map((ind, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs font-medium ${
              ind.type === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${ind.type === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} />
            {ind.label}
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-sm text-surface-400 hover:border-surface-300 hover:text-surface-500 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Buscar (Ctrl+K)"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Buscar...</span>
          <kbd className="ml-2 rounded border border-surface-200 bg-white px-1.5 py-0.5 text-2xs text-surface-400">⌘K</kbd>
        </button>

        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/30" onClick={() => setSearchOpen(false)} />
            <div className="relative w-full max-w-lg rounded-xl border border-surface-200 bg-white shadow-xl overflow-hidden">
              <div className="flex items-center gap-3 border-b border-surface-200 px-4 py-3">
                <svg className="h-5 w-5 text-surface-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar módulos, datos, rutas..."
                  className="flex-1 border-0 bg-transparent text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none"
                  aria-label="Buscar"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="rounded-md p-1 text-surface-400 hover:text-surface-600 hover:bg-surface-100"
                  aria-label="Cerrar búsqueda"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-2">
                {searchQuery ? (
                  <div className="px-3 py-8 text-center text-sm text-surface-500">
                    No se encontraron resultados para "<span className="font-medium">{searchQuery}</span>"
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-surface-400">Sugerencias</p>
                    {sections.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-surface-700 hover:bg-surface-100"
                      >
                        <span className="text-surface-400">{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative rounded-lg p-2 text-surface-500 hover:bg-surface-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label={`Notificaciones${notifications.length > 0 ? ` (${notifications.length} sin leer)` : ''}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
              {notifications.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-72 rounded-xl border border-surface-200 bg-white shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-200">
              <p className="text-sm font-semibold text-surface-900">Notificaciones</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-surface-500">Sin notificaciones</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-50 border-b border-surface-100 last:border-0">
                    <span className={`mt-0.5 flex h-2 w-2 shrink-0 rounded-full ${
                      n.type === 'warning' ? 'bg-amber-500' : n.type === 'error' ? 'bg-red-500' : 'bg-primary-500'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900">{n.title}</p>
                      <p className="text-2xs text-surface-500">{n.time ? new Date(n.time).toLocaleTimeString('es-CO') : ''}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        aria-label="Perfil de usuario"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
    </header>
  )
}
