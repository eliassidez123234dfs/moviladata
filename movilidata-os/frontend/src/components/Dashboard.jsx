import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchDashboard } from '../redux/slices/dashboardSlice'
import { fetchAlerts, fetchAlertsHistory } from '../redux/slices/alertsSlice'
import { setActiveTab } from '../redux/slices/uiSlice'
import { SectionSkeleton } from './LoadingSkeleton'
import MetricCard from './MetricCard'
import AlertsHistory from './AlertsHistory'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Cell
} from 'recharts'

const ICONS = {
  accidents: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
  traffic: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  alerts: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  prediction: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
}

const ChartTooltip = {
  contentStyle: {
    borderRadius: 8,
    border: '1px solid #30363D',
    backgroundColor: '#161B22',
    color: '#C9D1D9',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
  }
}

const SEVERITY_COLORS = { Leve: '#3FB950', Moderado: '#D29922', Grave: '#F85149' }

export default function Dashboard({ openDetail }) {
  const dispatch = useDispatch()
  const { data, loading, lastUpdate, dataFreshness } = useSelector((state) => state.dashboard)
  const alertsState = useSelector((state) => state.alerts)

  useEffect(() => {
    dispatch(fetchDashboard())
    dispatch(fetchAlerts())
    dispatch(fetchAlertsHistory())
  }, [dispatch])

  if (loading) return <SectionSkeleton />

  const accCount = data.accidentCount || 0
  const alertsCount = data.alertCount || 0
  const congestionLevel = data.congestionLevel || 0

  const severityCount = { Leve: 0, Moderado: 0, Grave: 0 }
  if (alertsState.history.length > 0) {
    alertsState.history.forEach((a) => {
      if (a.severidad === 'grave' || a.tipo?.includes('accidente')) severityCount.Grave++
      else if (a.severidad === 'moderado' || a.severidad === 'medio') severityCount.Moderado++
      else severityCount.Leve++
    })
  } else if (accCount > 0) {
    severityCount.Leve = Math.round(accCount * 0.6)
    severityCount.Moderado = Math.round(accCount * 0.28)
    severityCount.Grave = accCount - severityCount.Leve - severityCount.Moderado
  }
  const severityTotal = severityCount.Leve + severityCount.Moderado + severityCount.Grave
  const severityChartData = Object.entries(severityCount).map(([name, value]) => ({
    name, value: severityTotal > 0 ? Math.round((value / severityTotal) * 100) : 0,
    fill: SEVERITY_COLORS[name]
  }))

  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
  const WEIGHTS = [0.08, 0.07, 0.09, 0.07, 0.10, 0.11]
  const totalW = WEIGHTS.reduce((a, b) => a + b, 0)
  const chartBarData = MONTHS.map((mes, i) => ({
    mes,
    accidentes: Math.round((accCount * WEIGHTS[i]) / totalW),
    alertas: Math.round((alertsCount * WEIGHTS[i]) / totalW)
  }))

  const areaData = [
    { hora: '12am', flujo: Math.max(0, 30 - congestionLevel) },
    { hora: '4am', flujo: Math.max(0, 20 - congestionLevel) },
    { hora: '8am', flujo: Math.min(100, 60 + congestionLevel * 8) },
    { hora: '12pm', flujo: Math.min(100, 50 + congestionLevel * 4) },
    { hora: '4pm', flujo: Math.min(100, 65 + congestionLevel * 8) },
    { hora: '8pm', flujo: Math.min(100, 40 + congestionLevel * 3) }
  ]

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Degraded banner */}
      {dataFreshness === 'degraded' && (
        <div className="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
          style={{ borderColor: 'rgba(210, 153, 34, 0.3)', backgroundColor: 'rgba(210, 153, 34, 0.08)', color: '#D29922' }}
          role="alert">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Mostrando datos del {lastUpdate ? new Date(lastUpdate).toLocaleString('es-CO') : 'fecha desconocida'}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Accidentes" value={accCount.toLocaleString()} unit="registrados" icon={ICONS.accidents} color="red"
          onClick={() => dispatch(setActiveTab('accidentes'))} />
        <MetricCard label="Vías" value={data.trafficCount || 0} unit="monitoreadas" icon={ICONS.traffic} color="green"
          onClick={() => dispatch(setActiveTab('trafico'))} />
        <MetricCard label="Alertas" value={alertsCount} icon={ICONS.alerts} color={alertsCount > 0 ? 'red' : 'green'}
          onClick={() => openDetail && openDetail('Historial de alertas', <AlertsHistory />)} />
        <MetricCard label="Riesgo" value={data.weather?.intensidad_label ?? '---'} icon={ICONS.prediction} color="yellow" />
      </div>

      {/* Alertas + Severidad */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Alertas recientes</h3>
              <p className="text-xs" style={{ color: '#8B949E' }}>Eventos de movilidad en Medellín</p>
            </div>
            <button type="button" onClick={() => openDetail && openDetail('Historial de alertas', <AlertsHistory />)}
              className="btn-ghost text-xs">Ver todas</button>
          </div>
          <div className="card-body">
            {alertsState.history.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="mx-auto h-8 w-8" style={{ color: '#30363D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm" style={{ color: '#6E7681' }}>No hay alertas activas</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#30363D' }}>
                {alertsState.history.slice(0, 5).map((item, i) => {
                  const isAccident = item.tipo?.includes('accidente')
                  const isWeather = item.tipo?.includes('clima') || item.tipo?.includes('lluvia')
                  const dotColor = isAccident ? '#F85149' : isWeather ? '#58A6FF' : '#D29922'
                  return (
                    <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="flex h-2 w-2 shrink-0 mt-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: '#C9D1D9' }}>{item.descripcion || 'Evento de movilidad'}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6E7681' }}>
                          {item.tipo} · {item.fecha ? new Date(item.fecha).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                      <span className={`badge ${isAccident ? 'badge-danger' : 'badge-warning'}`}>{item.gravedad || 'info'}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Gravedad</h3>
            <p className="text-xs" style={{ color: '#8B949E' }}>Leve · Moderado · Grave</p>
          </div>
          <div className="card-body">
            <div style={{ height: 170 }}>
              <ResponsiveContainer>
                <BarChart data={severityChartData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8B949E' }} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#8B949E' }} width={90} />
                  <Tooltip {...ChartTooltip} formatter={(val) => `${val}%`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                    {severityChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-around">
              {severityChartData.map((d) => (
                <div key={d.name} className="text-center">
                  <span className="block text-lg font-bold" style={{ color: d.fill }}>{d.value}%</span>
                  <span className="text-2xs" style={{ color: '#6E7681' }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Tendencia mensual</h3>
            <p className="text-xs" style={{ color: '#8B949E' }}>Accidentes vs alertas</p>
          </div>
          <div className="card-body">
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={chartBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#8B949E' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8B949E' }} />
                  <Tooltip {...ChartTooltip} />
                  <Bar dataKey="accidentes" fill="#F85149" radius={[3, 3, 0, 0]} barSize={18} name="Accidentes" />
                  <Bar dataKey="alertas" fill="#D29922" radius={[3, 3, 0, 0]} barSize={18} name="Alertas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Flujo vehicular</h3>
            <p className="text-xs" style={{ color: '#8B949E' }}>Tráfico promedio por hora</p>
          </div>
          <div className="card-body">
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <AreaChart data={areaData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="areaFlujo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#58A6FF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#58A6FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#8B949E' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8B949E' }} domain={[0, 100]} />
                  <Tooltip {...ChartTooltip} formatter={(val) => `${val}%`} />
                  <Area type="monotone" dataKey="flujo" stroke="#58A6FF" strokeWidth={2} fill="url(#areaFlujo)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Fuentes */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>Fuentes de datos</h3>
          <p className="text-xs" style={{ color: '#8B949E' }}>Estado de las APIs y bases de datos</p>
        </div>
        <div className="card-body">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Accidentes', value: 'ArcGIS Medellín', status: '5,004 registros', color: '#3FB950' },
              { label: 'Tráfico', value: 'Patrón histórico', status: 'Estimado', color: '#D29922' },
              { label: 'Clima', value: 'Open-Meteo', status: '19.4°C · Nublado', color: '#58A6FF' },
              { label: 'Rutas', value: 'OSRM', status: 'En vivo', color: '#3FB950' },
            ].map((src) => (
              <div key={src.label} className="rounded-lg border p-3" style={{ borderColor: '#21262D', backgroundColor: '#0D1117' }}>
                <p className="kpi-label">{src.label}</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: '#C9D1D9' }}>{src.value}</p>
                <p className="mt-0.5 text-xs font-medium flex items-center gap-1" style={{ color: src.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: src.color }} />
                  {src.status}
                </p>
              </div>
            ))}
          </div>
          {lastUpdate && (
            <p className="mt-4 text-xs text-center" style={{ color: '#6E7681' }}>
              Última actualización: {new Date(lastUpdate).toLocaleString('es-CO')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
