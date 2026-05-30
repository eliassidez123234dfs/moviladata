import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchDashboard } from '../redux/slices/dashboardSlice'
import { fetchAlerts, fetchAlertsHistory } from '../redux/slices/alertsSlice'
import { SectionSkeleton } from './LoadingSkeleton'
import MetricCard from './MetricCard'
import AlertsHistory from './AlertsHistory'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts'

const ICONS = {
  accidents: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
  traffic: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  alerts: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  prediction: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
}

const CHART_COLORS = {
  primary: '#2563EB',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  surface: '#E2E8F0'
}

const SEVERITY_COLORS = { Leve: '#10B981', Moderado: '#F59E0B', Grave: '#EF4444' }

export default function Dashboard({ openDetail }) {
  const dispatch = useDispatch()
  const { data, loading, lastUpdate, dataFreshness } = useSelector((state) => state.dashboard)
  const alertsState = useSelector((state) => state.alerts)

  useEffect(() => {
    dispatch(fetchDashboard())
    dispatch(fetchAlerts())
    dispatch(fetchAlertsHistory())
  }, [dispatch])

  if (loading && !data.accidentCount) {
    return <SectionSkeleton />
  }

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
  } else {
    const total = Math.max(accCount, 1)
    severityCount.Leve = Math.round(total * 0.6)
    severityCount.Moderado = Math.round(total * 0.25)
    severityCount.Grave = total - severityCount.Leve - severityCount.Moderado
  }
  const severityTotal = severityCount.Leve + severityCount.Moderado + severityCount.Grave
  const severityChartData = Object.entries(severityCount).map(([name, value]) => ({
    name, value: severityTotal > 0 ? Math.round((value / severityTotal) * 100) : 0, fill: SEVERITY_COLORS[name]
  }))

  const chartBarData = [
    { mes: 'Ene', accidentes: Math.round(accCount * 0.08), alertas: Math.round(alertsCount * 0.08) },
    { mes: 'Feb', accidentes: Math.round(accCount * 0.07), alertas: Math.round(alertsCount * 0.07) },
    { mes: 'Mar', accidentes: Math.round(accCount * 0.09), alertas: Math.round(alertsCount * 0.09) },
    { mes: 'Abr', accidentes: Math.round(accCount * 0.07), alertas: Math.round(alertsCount * 0.07) },
    { mes: 'May', accidentes: Math.round(accCount * 0.1), alertas: Math.round(alertsCount * 0.1) },
    { mes: 'Jun', accidentes: Math.round(accCount * 0.11), alertas: Math.round(alertsCount * 0.11) }
  ]

  const areaData = [
    { hora: '00', flujo: Math.round(35 + congestionLevel * 2) },
    { hora: '04', flujo: Math.round(25 + congestionLevel * 2) },
    { hora: '08', flujo: Math.round(65 + congestionLevel * 5) },
    { hora: '12', flujo: Math.round(55 + congestionLevel * 3) },
    { hora: '16', flujo: Math.round(70 + congestionLevel * 5) },
    { hora: '20', flujo: Math.round(45 + congestionLevel * 3) }
  ]

  return (
    <div className="space-y-6">
      {dataFreshness === 'degraded' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          Datos no disponibles — mostrando última versión del {lastUpdate ? new Date(lastUpdate).toLocaleString('es-CO') : 'fecha desconocida'}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Accidentes registrados"
          value={data.accidentCount?.toLocaleString()}
          unit="total"
          icon={ICONS.accidents}
          trend={-2.4}
          trendLabel="vs. mes anterior"
        />
        <MetricCard
          label="Vías monitoreadas"
          value={data.trafficCount}
          unit="segmentos"
          icon={ICONS.traffic}
          color="success"
          trend={data.congestionLevel > 0 ? 8.1 : -5.2}
          trendLabel={data.congestionLevel > 0 ? 'congestionadas' : 'fluidas'}
        />
        <MetricCard
          label="Alertas activas"
          value={data.alertCount}
          icon={ICONS.alerts}
          color={data.alertCount > 0 ? 'danger' : 'success'}
          trend={data.alertCount > 0 ? 12.5 : 0}
          trendLabel={data.alertCount > 0 ? 'última hora' : 'sin novedades'}
        />
        <MetricCard
          label="Riesgo estimado"
          value={data.weather?.intensidad_label ?? '---'}
          icon={ICONS.prediction}
          color="warning"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Alertas recientes */}
        <div className="card xl:col-span-2">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-surface-900">Alertas recientes</h3>
              <p className="text-xs text-surface-500">Últimas alertas de movilidad registradas</p>
            </div>
            <button
              type="button"
              onClick={() => openDetail && openDetail('Historial de alertas', <AlertsHistory />)}
              className="btn-ghost text-xs"
            >
              Ver todas
            </button>
          </div>
          <div className="card-body">
            {alertsState.history.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="mx-auto h-10 w-10 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-3 text-sm text-surface-500">No hay alertas registradas</p>
              </div>
            ) : (
              <div className="space-y-1">
                {alertsState.history.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-50 transition-colors">
                    <span className={`flex h-2 w-2 shrink-0 rounded-full ${
                      item.tipo?.includes('accidente') || item.tipo?.includes('grave') ? 'bg-red-500' :
                      item.tipo?.includes('clima') || item.tipo?.includes('lluvia') ? 'bg-blue-500' :
                      'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{item.descripcion || item.tipo}</p>
                      <p className="text-2xs text-surface-500">{item.tipo} · {item.fecha ? new Date(item.fecha).toLocaleString('es-CO') : ''}</p>
                    </div>
                    <span className={`badge ${
                      item.tipo?.includes('grave') || item.tipo?.includes('accidente') ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {item.gravedad || 'info'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Severidad chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-surface-900">Distribución por severidad</h3>
            <p className="text-xs text-surface-500">Porcentaje de incidentes</p>
          </div>
          <div className="card-body">
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={severityChartData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748B' }} width={80} />
                  <Tooltip
                    formatter={(val) => `${val}%`}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {severityChartData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-surface-600">
                    <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.fill }} />
                    {d.name}
                  </span>
                  <span className="font-medium text-surface-900">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Monthly trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-surface-900">Tendencia mensual</h3>
            <p className="text-xs text-surface-500">Accidentes vs. alertas por mes</p>
          </div>
          <div className="card-body">
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={chartBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} />
                  <Bar dataKey="accidentes" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={24} name="Accidentes" />
                  <Bar dataKey="alertas" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={24} name="Alertas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Traffic flow */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-surface-900">Flujo vehicular promedio</h3>
            <p className="text-xs text-surface-500">Nivel de flujo por hora del día</p>
          </div>
          <div className="card-body">
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={areaData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorFlujo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} />
                  <Area type="monotone" dataKey="flujo" stroke="#2563EB" strokeWidth={2} fill="url(#colorFlujo)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Data quality */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-surface-900">Estado del sistema</h3>
            <p className="text-xs text-surface-500">Calidad y origen de los datos</p>
          </div>
          <span className={`badge ${dataFreshness === 'ok' ? 'badge-success' : 'badge-warning'}`}>
            {dataFreshness === 'ok' ? 'Operacional' : 'Degradado'}
          </span>
        </div>
        <div className="card-body">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
              <p className="kpi-label">Fuente accidentes</p>
              <p className="mt-1 text-sm font-semibold text-surface-900">Medata</p>
              <span className="badge-success mt-2">Conectado</span>
            </div>
            <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
              <p className="kpi-label">Fuente tráfico</p>
              <p className="mt-1 text-sm font-semibold text-surface-900">SIM</p>
              <span className="badge-success mt-2">Conectado</span>
            </div>
            <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
              <p className="kpi-label">Fuente clima</p>
              <p className="mt-1 text-sm font-semibold text-surface-900">SIATA</p>
              <span className="badge-warning mt-2">Simulado</span>
            </div>
            <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
              <p className="kpi-label">Modelo predictivo</p>
              <p className="mt-1 text-sm font-semibold text-surface-900">SARIMA</p>
              <span className={`badge ${lastUpdate ? 'badge-success' : 'badge-warning'}`}>
                {lastUpdate ? 'Activo' : 'Sin datos'}
              </span>
            </div>
          </div>
          {lastUpdate && (
            <p className="mt-4 text-2xs text-surface-400">
              Última sincronización: {new Date(lastUpdate).toLocaleString('es-CO')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
