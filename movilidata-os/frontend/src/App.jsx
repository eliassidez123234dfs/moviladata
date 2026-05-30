import { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setActiveTab, setOfflineMode, addNotification } from './redux/slices/uiSlice'
import { fetchDashboard } from './redux/slices/dashboardSlice'
import Dashboard from './components/Dashboard'
import HeatmapAccidents from './components/HeatmapAccidents'
import TrafficMonitor from './components/TrafficMonitor'
import SafeRoute from './components/SafeRoute'
import Prediction from './components/Prediction'
import Assistant from './components/Assistant'
import ToastContainer from './components/ToastContainer'
import ErrorBoundary from './components/ErrorBoundary'
import DetailPanel from './components/DetailPanel'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'accidentes', label: 'Accidentes', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'trafico', label: 'Tráfico', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { id: 'prediccion', label: 'Predicción', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'rutas', label: 'Rutas Seguras', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { id: 'asistente', label: 'Asistente IA', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
]

export default function App() {
  const dispatch = useDispatch()
  const { activeTab, offlineMode } = useSelector((state) => state.ui)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailContent, setDetailContent] = useState(null)
  const [detailTitle, setDetailTitle] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  useEffect(() => {
    dispatch(fetchDashboard())
    const id = setInterval(() => dispatch(fetchDashboard()), 60000)
    return () => clearInterval(id)
  }, [dispatch])

  useEffect(() => {
    const handleOnline = () => {
      dispatch(setOfflineMode(false))
      dispatch(addNotification({ type: 'success', title: 'Conectado', message: 'Conexión restablecida.' }))
    }
    const handleOffline = () => {
      dispatch(setOfflineMode(true))
      dispatch(addNotification({ type: 'warning', title: 'Sin conexión', message: 'Mostrando datos en caché.' }))
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [dispatch])

  const openDetail = useCallback((title, content) => {
    setDetailTitle(title)
    setDetailContent(content)
    setDetailOpen(true)
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0D1117', color: '#C9D1D9' }}>
      <div className="relative">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-github-blue focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          Saltar al contenido principal
        </a>

        <ToastContainer />

        {/* Header */}
        <header className="sticky top-0 z-30 border-b" style={{
          backgroundColor: '#161B22',
          borderColor: '#30363D'
        }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 lg:h-16">

              {/* Logo */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#238636' }}>
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B949E' }}>Movilidata OS</p>
                  <h1 className="text-sm font-bold" style={{ color: '#C9D1D9' }}>Medellín</h1>
                </div>
              </div>

              {/* Nav */}
              <nav className="hidden md:flex items-center gap-0.5" aria-label="Navegación principal">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => dispatch(setActiveTab(item.id))}
                      aria-current={isActive ? 'page' : undefined}
                      className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150"
                      style={{
                        color: isActive ? '#C9D1D9' : '#8B949E',
                        backgroundColor: isActive ? 'rgba(88, 166, 255, 0.12)' : 'transparent',
                      }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </nav>

              {/* Right */}
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: offlineMode ? 'rgba(210, 153, 34, 0.1)' : 'rgba(63, 185, 80, 0.1)',
                    color: offlineMode ? '#D29922' : '#3FB950',
                    border: `1px solid ${offlineMode ? 'rgba(210, 153, 34, 0.2)' : 'rgba(63, 185, 80, 0.2)'}`
                  }}>
                  <span className={`flex h-1.5 w-1.5 rounded-full ${offlineMode ? 'bg-warning' : 'bg-safe'}`} />
                  {offlineMode ? 'Sin conexión' : 'En línea'}
                </div>

                {/* Nueva Ruta */}
                <button
                  type="button"
                  onClick={() => dispatch(setActiveTab('rutas'))}
                  className="hidden lg:flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150"
                  style={{
                    backgroundColor: '#238636',
                    color: '#FFFFFF',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2EA043'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#238636'}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Nueva Ruta
                </button>

                {/* Mobile menu */}
                <button
                  type="button"
                  onClick={() => setMobileMenu(!mobileMenu)}
                  className="md:hidden flex items-center justify-center w-8 h-8 rounded-md transition-colors"
                  style={{ color: '#8B949E', border: '1px solid #30363D' }}
                  aria-label="Abrir menú"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileMenu && (
            <div className="md:hidden border-t" style={{ borderColor: '#30363D' }}>
              <nav className="px-4 py-2 space-y-0.5">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { dispatch(setActiveTab(item.id)); setMobileMenu(false) }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all"
                      style={{
                        color: isActive ? '#C9D1D9' : '#8B949E',
                        backgroundColor: isActive ? 'rgba(88, 166, 255, 0.12)' : 'transparent'
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          )}
        </header>

        {/* Main */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 min-h-[calc(100vh-4rem)]">
          {activeTab === 'dashboard' && <ErrorBoundary><Dashboard openDetail={openDetail} /></ErrorBoundary>}
          {activeTab === 'accidentes' && <ErrorBoundary><HeatmapAccidents openDetail={openDetail} /></ErrorBoundary>}
          {activeTab === 'trafico' && <ErrorBoundary><TrafficMonitor openDetail={openDetail} /></ErrorBoundary>}
          {activeTab === 'prediccion' && <ErrorBoundary><Prediction /></ErrorBoundary>}
          {activeTab === 'rutas' && <ErrorBoundary><SafeRoute /></ErrorBoundary>}
          {activeTab === 'asistente' && <ErrorBoundary><Assistant /></ErrorBoundary>}
        </main>


      </div>

      <DetailPanel open={detailOpen} onClose={() => setDetailOpen(false)} title={detailTitle}>
        {detailContent}
      </DetailPanel>
    </div>
  )
}
