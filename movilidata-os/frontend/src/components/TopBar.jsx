import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getAccidents, getWeather, getAlerts } from '../services/api'

export default function TopBar() {
  const dispatch = useDispatch()
  const { activeTab, offlineMode } = useSelector((state) => state.ui)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [alertsCount, setAlertsCount] = useState(0)
  const [weatherInfo, setWeatherInfo] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    getAlerts().then(r => setAlertsCount(r?.alerts?.length ?? 0)).catch(() => {})
    getWeather().then(r => {
      if (r?.intensidad_label) setWeatherInfo(`${r.intensidad_label} · ${r.precipitacion_mmh || 0} mm/h`)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.length < 2) { setSearchResults([]); return }
    getAccidents({ q: query, limit: 5 })
      .then(r => setSearchResults(r?.features || []))
      .catch(() => setSearchResults([]))
  }

  return (
    <div className="flex items-center gap-3">
      {/* Search */}
      <div className="relative" ref={searchRef}>
        <input
          type="search"
          placeholder="Buscar accidentes..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowSearch(true)}
          className="w-44 lg:w-56 rounded-xl border px-3 py-1.5 text-sm transition-all duration-200"
          style={{
            background: 'rgba(26, 26, 46, 0.6)',
            borderColor: 'rgba(0, 255, 255, 0.15)',
            color: '#F1F5F9'
          }}
          aria-label="Buscar accidentes"
        />
        {showSearch && (
          <div className="absolute top-full mt-1 w-full rounded-xl border shadow-lg overflow-hidden z-50"
            style={{
              background: 'rgba(26, 26, 46, 0.95)',
              borderColor: 'rgba(0, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)'
            }}>
            {searchResults.length > 0 ? (
              searchResults.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => { setShowSearch(false); setSearchQuery('') }}
                  className="w-full px-3 py-2 text-left text-sm transition-colors"
                  style={{ color: '#F1F5F9' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 255, 255, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="font-medium" style={{ color: '#00FFFF' }}>{item.properties?.comuna || 'Sin comuna'}</span>
                  <span className="ml-2" style={{ color: 'rgba(241, 245, 249, 0.4)' }}>
                    {item.properties?.tipo} · {item.properties?.fecha?.split(' ')[0]}
                  </span>
                </button>
              ))
            ) : searchQuery.length >= 2 ? (
              <div className="px-3 py-4 text-sm text-center" style={{ color: 'rgba(241, 245, 249, 0.4)' }}>
                Sin resultados para "{searchQuery}"
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Weather */}
      <div className="hidden lg:flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium"
        style={{
          background: 'rgba(0, 255, 255, 0.08)',
          color: '#00FFFF',
          border: '1px solid rgba(0, 255, 255, 0.12)'
        }}>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
        {weatherInfo || 'Cargando...'}
      </div>

      {/* Notifications bell */}
      <button
        type="button"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
        style={{
          color: '#00FFFF',
          border: '1px solid rgba(0, 255, 255, 0.15)'
        }}
        aria-label={`Notificaciones: ${alertsCount} alertas activas`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {alertsCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-2xs font-bold text-black"
            style={{ background: '#FF4444', boxShadow: '0 0 8px rgba(255, 68, 68, 0.5)' }}>
            {alertsCount > 9 ? '9+' : alertsCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div
          className="absolute top-16 right-4 w-80 rounded-2xl border shadow-lg overflow-hidden z-50"
          style={{
            background: 'rgba(26, 26, 46, 0.95)',
            borderColor: 'rgba(0, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(0, 255, 255, 0.08)' }}>
            <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Notificaciones</p>
          </div>
          {alertsCount === 0 ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'rgba(241, 245, 249, 0.4)' }}>
              No hay notificaciones nuevas
            </div>
          ) : (
            <p className="px-4 py-3 text-sm" style={{ color: 'rgba(241, 245, 249, 0.7)' }}>
              {alertsCount} alerta(s) activa(s)
            </p>
          )}
        </div>
      )}
    </div>
  )
}
