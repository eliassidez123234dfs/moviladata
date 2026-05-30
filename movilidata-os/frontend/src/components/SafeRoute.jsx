import { useState, useEffect, useRef, useCallback } from 'react'
import { sendSafeRoute, getWeather, searchAddress, reverseGeocode } from '../services/api'
import MapWrapper from './MapComponent'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ORIGIN_ICON = L.divIcon({
  className: '',
  html: '<div style="width:24px;height:24px;background:#238636;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.3)">A</div>',
  iconSize: [24, 24], iconAnchor: [12, 12]
})

const DEST_ICON = L.divIcon({
  className: '',
  html: '<div style="width:24px;height:24px;background:#DA3633;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.3)">B</div>',
  iconSize: [24, 24], iconAnchor: [12, 12]
})

const USER_ICON = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#58A6FF;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(88,166,255,0.3)"></div>',
  iconSize: [16, 16], iconAnchor: [8, 8]
})

const ROUTE_COLORS = ['#58A6FF', '#3FB950', '#BC8CFF']

function MapClickHandler({ onMapClick, mode }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const handler = (e) => onMapClick && onMapClick([e.latlng.lat, e.latlng.lng])
    map.on('click', handler)
    map.getContainer().style.cursor = mode ? 'crosshair' : ''
    return () => { map.off('click', handler); map.getContainer().style.cursor = '' }
  }, [map, onMapClick, mode])
  return null
}

function MapMarkers({ origin, destination, userPos }) {
  const map = useMap()
  const markersRef = useRef([])
  useEffect(() => {
    const m = []
    if (userPos) {
      m.push(L.marker(userPos, { icon: USER_ICON, zIndexOffset: 500 }).addTo(map).bindPopup('Tu ubicación'))
    }
    if (origin) {
      m.push(L.marker(origin, { icon: ORIGIN_ICON, zIndexOffset: 1000 }).addTo(map).bindPopup('<strong>Origen</strong>'))
    }
    if (destination) {
      m.push(L.marker(destination, { icon: DEST_ICON, zIndexOffset: 1000 }).addTo(map).bindPopup('<strong>Destino</strong>'))
    }
    markersRef.current = m
    return () => m.forEach((mk) => map.removeLayer(mk))
  }, [map, origin, destination, userPos])
  return null
}

function RouteLayers({ routes, selectedIndex, onSelectRoute }) {
  const map = useMap()
  const layersRef = useRef([])
  useEffect(() => {
    if (!map || !routes?.length) return
    const layers = routes.map((route, i) => {
      const coords = route.geometry?.coordinates?.map(c => [c[1], c[0]]) || []
      if (coords.length < 2) return null
      const isSelected = i === selectedIndex
      const polyline = L.polyline(coords, {
        color: isSelected ? '#58A6FF' : ROUTE_COLORS[i % ROUTE_COLORS.length],
        weight: isSelected ? 6 : 3,
        opacity: isSelected ? 0.9 : 0.5,
        dashArray: isSelected ? null : '8, 8'
      }).addTo(map)
      const mid = coords[Math.floor(coords.length / 2)]
      const dist = (route.legs?.[0]?.distance / 1000) || 0
      const dur = Math.round((route.legs?.[0]?.duration / 60)) || 0
      const label = L.divIcon({
        className: '',
        html: `<div style="background:#161B22;padding:3px 10px;border-radius:8px;border:2px solid ${ROUTE_COLORS[i]};font-size:11px;font-weight:600;color:#C9D1D9;cursor:pointer;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${dist.toFixed(1)}km · ${dur}min</div>`,
        iconSize: [0, 0], iconAnchor: [0, 0]
      })
      const marker = L.marker(mid, { icon: label, interactive: true }).addTo(map)
      marker.on('click', () => onSelectRoute(i))
      polyline.on('click', () => onSelectRoute(i))
      return { polyline, marker }
    }).filter(Boolean)
    if (selectedIndex === 0 && layers[0] && routes[0]?.geometry?.coordinates?.length > 1) {
      const bounds = L.latLngBounds(routes[0].geometry.coordinates.map(c => [c[1], c[0]]))
      map.fitBounds(bounds.pad(0.3))
    }
    layersRef.current = layers
    return () => layers.forEach(l => { map.removeLayer(l.polyline); map.removeLayer(l.marker) })
  }, [map, routes, selectedIndex, onSelectRoute])
  return null
}

function NavigationView({ steps, onBack }) {
  const [currentStep, setCurrentStep] = useState(0)
  const listRef = useRef(null)
  const totalDist = steps.reduce((s, st) => s + (st.distance || 0), 0)
  const totalDur = steps.reduce((s, st) => s + (st.duration || 0), 0)
  useEffect(() => { listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [steps])
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Navegación paso a paso</h3>
          <p className="text-xs" style={{ color: '#8B949E' }}>{(totalDist / 1000).toFixed(1)} km · {Math.round(totalDur / 60)} min · {steps.length} pasos</p>
        </div>
        <button onClick={onBack} className="btn-ghost text-xs px-2 py-1">✕ Cerrar</button>
      </div>
      <div ref={listRef} className="card-body max-h-72 overflow-y-auto space-y-1">
        {steps.map((step, i) => (
          <div key={i} onClick={() => setCurrentStep(i)}
            className={`flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer ${
              i === currentStep ? 'border' : ''
            } ${i < currentStep ? 'opacity-50' : 'hover:bg-gray-800'}`}
            style={i === currentStep ? { backgroundColor: 'rgba(88,166,255,0.08)', borderColor: '#58A6FF' } : { borderColor: 'transparent', borderWidth: 1 }}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              i === currentStep ? 'bg-blue-500 text-white' :
              i < currentStep ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
            }`}>{i < currentStep ? '✓' : i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: i === currentStep ? '#58A6FF' : '#C9D1D9' }}>{step.instruction}</p>
              {((step.name) || step.distance > 0 || step.duration > 0) && (
                <p className="text-xs mt-0.5" style={{ color: '#6E7681' }}>
                  {step.name && `${step.name} · `}{step.distance > 0 ? `${step.distance}m` : ''}
                  {step.duration > 0 ? ` · ${Math.round(step.duration / 60)}min` : ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SuggestionItem({ item, onClick }) {
  return (
    <button type="button"
      className="flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left transition-colors"
      style={{ borderBottom: '1px solid #21262D' }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#21262D'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      onClick={() => onClick(item)}>
      <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#8B949E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      </svg>
      <div className="min-w-0">
        <p className="text-sm truncate" style={{ color: '#C9D1D9' }}>{item.display_name}</p>
        {item.type && <p className="text-2xs mt-0.5" style={{ color: '#6E7681' }}>{item.type}</p>}
      </div>
    </button>
  )
}

export default function SafeRoute() {
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [userPos, setUserPos] = useState(null)
  const [mode, setMode] = useState(null)
  const [route, setRoute] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNav, setShowNav] = useState(false)
  const [followUser, setFollowUser] = useState(false)

  const [originQuery, setOriginQuery] = useState('')
  const [destQuery, setDestQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionTarget, setSuggestionTarget] = useState(null)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)
  const originRef = useRef(null)
  const destRef = useRef(null)

  useEffect(() => {
    getWeather().then(setWeather).catch(() => {})
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserPos([pos.coords.latitude, pos.coords.longitude]) },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }, [])

  useEffect(() => {
    let watchId
    if (followUser && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 3000 }
      )
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId) }
  }, [followUser])

  const handleSearch = useCallback((query, target) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query || query.length < 3) { setSuggestions([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAddress(query)
        setSuggestions(results.slice(0, 6))
        setSuggestionTarget(target)
      } catch { setSuggestions([]) }
      setSearching(false)
    }, 350)
  }, [])

  const selectSuggestion = useCallback((item, target) => {
    const coords = [parseFloat(item.lat), parseFloat(item.lon)]
    if (target === 'origin') {
      setOrigin(coords)
      setOriginQuery(item.display_name)
    } else {
      setDestination(coords)
      setDestQuery(item.display_name)
    }
    setSuggestions([])
    setSuggestionTarget(null)
  }, [])

  const handleMapClick = useCallback(async (latlng) => {
    if (!mode) return
    if (mode === 'origin') {
      setOrigin(latlng)
      setOriginQuery(`${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)}`)
      setMode('destination')
      reverseGeocode(latlng[0], latlng[1]).then((d) => {
        if (d?.display_name) setOriginQuery(d.display_name)
      }).catch(() => {})
    } else if (mode === 'destination') {
      setDestination(latlng)
      setDestQuery(`${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)}`)
      setMode(null)
      reverseGeocode(latlng[0], latlng[1]).then((d) => {
        if (d?.display_name) setDestQuery(d.display_name)
      }).catch(() => {})
    }
  }, [mode])

  const useMyLocation = useCallback(() => {
    if (!userPos) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = [pos.coords.latitude, pos.coords.longitude]
          setOrigin(p)
          setOriginQuery(`${p[0].toFixed(4)}, ${p[1].toFixed(4)}`)
          setMode('destination')
          reverseGeocode(p[0], p[1]).then((d) => {
            if (d?.display_name) setOriginQuery(d.display_name)
          }).catch(() => {})
        },
        () => setError('No se pudo obtener tu ubicación. Activa el GPS.'),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    } else {
      setOrigin(userPos)
      setOriginQuery(`${userPos[0].toFixed(4)}, ${userPos[1].toFixed(4)}`)
      setMode('destination')
      reverseGeocode(userPos[0], userPos[1]).then((d) => {
        if (d?.display_name) setOriginQuery(d.display_name)
      }).catch(() => {})
    }
  }, [userPos])

  const handleCalculate = async () => {
    const o = origin || userPos
    const d = destination
    if (!o) { setError('Selecciona o escribe el origen'); return }
    if (!d) { setError('Selecciona o escribe el destino'); return }
    setLoading(true); setError(''); setShowNav(false)
    try {
      const result = await sendSafeRoute(o, d)
      setRoute(result); setSelectedRoute(0)
    } catch {
      setError('No se pudo calcular la ruta. Intenta de nuevo.')
      setRoute(null)
    } finally { setLoading(false) }
  }

  const handleReset = () => {
    setOrigin(null); setDestination(null); setRoute(null); setMode(null)
    setShowNav(false); setError(''); setOriginQuery(''); setDestQuery('')
    setSuggestions([])
  }

  const currentRoutes = route?.routes
  const currentSteps = currentRoutes?.[selectedRoute]?.legs?.[0]?.steps
  const avoidZones = route?.metadata?.avoid_zones
  const riskLevels = route?.metadata?.risk_levels
  const mapCenter = destination || origin || userPos || [6.25, -75.57]

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#C9D1D9' }}>Rutas Seguras</h2>
          <p className="text-sm hidden sm:block" style={{ color: '#8B949E' }}>Escribe la dirección o haz clic en el mapa</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFollowUser(!followUser)}
            className={`btn text-xs ${followUser ? 'btn-primary' : 'btn-secondary'}`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="hidden sm:inline">{followUser ? 'Siguiendo' : 'Seguirme'}</span>
          </button>
        </div>
      </div>

      {/* Search fields */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative" ref={originRef}>
          <label className="block mb-1 text-xs font-medium" style={{ color: '#8B949E' }}>
            {origin ? <span style={{ color: '#3FB950' }}>✅ Origen</span> : '📍 Origen'}
          </label>
          <div className="relative">
            <input
              value={originQuery}
              onChange={(e) => { setOriginQuery(e.target.value); handleSearch(e.target.value, 'origin') }}
              onFocus={() => { setMode('origin'); if (originQuery.length > 2) handleSearch(originQuery, 'origin') }}
              placeholder="Ej: Estación Estadio, Medellín"
              className="input pr-8 text-sm"
              aria-label="Dirección de origen"
              autoComplete="off"
            />
            {origin && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#6E7681' }}
                onClick={() => { setOrigin(null); setOriginQuery(''); setSuggestions([]) }}>✕</button>
            )}
          </div>
          {suggestionTarget === 'origin' && suggestions.length > 0 && !origin && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border shadow-lg max-h-64 overflow-y-auto"
              style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}>
              {suggestions.map((s, i) => (
                <SuggestionItem key={s.osm_id || i} item={s} onClick={() => selectSuggestion(s, 'origin')} />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 relative" ref={destRef}>
          <label className="block mb-1 text-xs font-medium" style={{ color: '#8B949E' }}>
            {destination ? <span style={{ color: '#F85149' }}>✅ Destino</span> : '🎯 Destino'}
          </label>
          <div className="relative">
            <input
              value={destQuery}
              onChange={(e) => { setDestQuery(e.target.value); handleSearch(e.target.value, 'destination') }}
              onFocus={() => { setMode('destination'); if (destQuery.length > 2) handleSearch(destQuery, 'destination') }}
              placeholder="Ej: Parque Lleras, Medellín"
              className="input pr-8 text-sm"
              aria-label="Dirección de destino"
              disabled={!origin && !userPos}
              autoComplete="off"
            />
            {destination && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#6E7681' }}
                onClick={() => { setDestination(null); setDestQuery(''); setSuggestions([]) }}>✕</button>
            )}
          </div>
          {suggestionTarget === 'destination' && suggestions.length > 0 && !destination && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border shadow-lg max-h-64 overflow-y-auto"
              style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}>
              {suggestions.map((s, i) => (
                <SuggestionItem key={s.osm_id || i} item={s} onClick={() => selectSuggestion(s, 'destination')} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {!origin && (
          <button type="button" onClick={useMyLocation}
            className="btn-secondary text-xs">
            📍 Usar mi ubicación como origen
          </button>
        )}
        <button type="button"
          onClick={() => setMode(mode === 'origin' ? null : 'origin')}
          className={`btn text-xs ${mode === 'origin' ? 'btn-primary' : 'btn-secondary'}`}>
          {mode === 'origin' ? '🟢 Modo origen activo (clic en mapa)' : '🟢 Marcar en mapa'}
        </button>
        <button type="button"
          onClick={() => setMode(mode === 'destination' ? null : 'destination')}
          disabled={!origin && !userPos}
          className={`btn text-xs ${mode === 'destination' ? 'btn-primary' : 'btn-secondary'}`}>
          {mode === 'destination' ? '🔴 Modo destino activo (clic en mapa)' : '🔴 Marcar en mapa'}
        </button>
        {(origin || destination || route || originQuery || destQuery) && (
          <button type="button" onClick={handleReset} className="btn-ghost text-xs">Limpiar todo</button>
        )}
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#30363D' }}>
        <MapWrapper height={380} center={mapCenter}>
          <MapClickHandler onMapClick={handleMapClick} mode={mode} />
          <MapMarkers origin={origin} destination={destination} userPos={userPos} />
          {currentRoutes && (
            <RouteLayers routes={currentRoutes} selectedIndex={selectedRoute} onSelectRoute={setSelectedRoute} />
          )}
        </MapWrapper>
      </div>

      {/* Calculate button */}
      {(origin || userPos) && destination && !route && (
        <button type="button" onClick={handleCalculate} disabled={loading}
          className="btn-primary w-full py-3 text-base">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculando ruta...
            </span>
          ) : 'Calcular ruta'}
        </button>
      )}

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(248,81,73,0.1)', color: '#F85149', border: '1px solid rgba(248,81,73,0.2)' }} role="alert">
          {error}
        </div>
      )}

      {/* Weather */}
      {weather && (
        <div className="card">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(88,166,255,0.1)' }}>
              <svg className="h-5 w-5" style={{ color: '#58A6FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B949E' }}>Clima</p>
              <p className="text-sm" style={{ color: '#C9D1D9' }}>
                {weather.temperatura ? `${weather.temperatura}°C` : ''}
                {weather.condicion ? ` · ${weather.condicion}` : ''}
                {weather.precipitacion_mmh != null && <span className="ml-2" style={{ color: '#8B949E' }}>Lluvia: {weather.precipitacion_mmh} mm/h</span>}
              </p>
            </div>
            <span className="text-xs" style={{ color: '#6E7681' }}>{weather.fuente}</span>
          </div>
        </div>
      )}

      {/* Routes display */}
      {route && currentRoutes?.length > 0 && (
        <div className="space-y-4">
          {currentRoutes.length > 1 && (
            <div className="flex flex-col sm:flex-row gap-2" role="radiogroup" aria-label="Seleccionar ruta">
              {currentRoutes.map((r, i) => {
                const dist = (r.legs?.[0]?.distance / 1000) || 0
                const dur = Math.round((r.legs?.[0]?.duration / 60)) || 0
                return (
                  <button key={i} onClick={() => setSelectedRoute(i)}
                    className="flex-1 rounded-xl border-2 p-3 text-center transition-all"
                    style={{
                      borderColor: i === selectedRoute ? '#58A6FF' : '#30363D',
                      backgroundColor: i === selectedRoute ? 'rgba(88,166,255,0.08)' : 'transparent'
                    }}
                    role="radio" aria-checked={i === selectedRoute}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="h-3 w-6 rounded" style={{ backgroundColor: ROUTE_COLORS[i] }} />
                      <span className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Ruta {i + 1}</span>
                    </div>
                    <div className="text-xs" style={{ color: '#8B949E' }}>{dist.toFixed(1)} km · {dur} min</div>
                    {i === 0 && <span className="badge-info mt-1 inline-block text-2xs">Más rápida</span>}
                  </button>
                )
              })}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Resumen</h3>
                </div>
                {currentSteps?.length > 0 && (
                  <button onClick={() => setShowNav(!showNav)} className="btn-primary text-xs px-3 py-1.5">
                    {showNav ? 'Ocultar' : 'Ver pasos'}
                  </button>
                )}
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg p-3" style={{ backgroundColor: '#0D1117' }}>
                    <p className="kpi-label">Distancia</p>
                    <p className="text-lg font-bold" style={{ color: '#C9D1D9' }}>
                      {((currentRoutes[selectedRoute]?.legs?.[0]?.distance || 0) / 1000).toFixed(1)} km
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ backgroundColor: '#0D1117' }}>
                    <p className="kpi-label">Duración</p>
                    <p className="text-lg font-bold" style={{ color: '#C9D1D9' }}>
                      {Math.round((currentRoutes[selectedRoute]?.legs?.[0]?.duration || 0) / 60)} min
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#8B949E' }}>
                    <span className="h-2 w-6 rounded" style={{ backgroundColor: ROUTE_COLORS[selectedRoute] }} />
                    Ruta #{selectedRoute + 1} · {currentSteps?.length || 0} instrucciones
                  </div>
                  {avoidZones?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#8B949E' }}>
                      <span className="h-2 w-6 rounded" style={{ backgroundColor: '#F85149' }} />
                      Zonas evitadas: {avoidZones.length}
                    </div>
                  )}
                </div>
                {route?.metadata?.fuente && (
                  <p className="mt-3 text-xs" style={{ color: '#6E7681' }}>Fuente: {route.metadata.fuente}</p>
                )}
              </div>
            </div>

            {avoidZones?.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Zonas de riesgo evitadas</h3>
                </div>
                <div className="card-body max-h-44 overflow-y-auto space-y-1">
                  {avoidZones.map((zone) => (
                    <div key={zone} className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: riskLevels?.[zone] === 'alta' ? '#F85149' : '#D29922' }} />
                      <span style={{ color: '#C9D1D9' }}>{zone}</span>
                      <span className="text-xs" style={{ color: '#6E7681' }}>· {riskLevels?.[zone] === 'alta' ? 'Alto' : 'Medio'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showNav && currentSteps?.length > 0 && (
            <NavigationView steps={currentSteps} onBack={() => setShowNav(false)} />
          )}
        </div>
      )}
    </div>
  )
}
