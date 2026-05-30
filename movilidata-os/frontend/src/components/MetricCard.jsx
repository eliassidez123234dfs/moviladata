export default function MetricCard({ label, value, unit, trend, trendLabel, icon, color = 'primary', loading }) {
  if (loading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-3 w-20 rounded bg-surface-200" />
        <div className="mt-3 h-8 w-16 rounded bg-surface-200" />
      </div>
    )
  }

  const colorMap = {
    primary: { dot: 'bg-primary-500', text: 'text-primary-600', bg: 'bg-primary-50' },
    success: { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    warning: { dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
    danger: { dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' }
  }

  const c = colorMap[color] || colorMap.primary

  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-150">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="kpi-label">{label}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="kpi-value">{value ?? '---'}</span>
            {unit && <span className="text-sm font-medium text-surface-400">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
            <svg className={`h-5 w-5 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
            trend >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            <svg className={`h-3 w-3 ${trend >= 0 ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {Math.abs(trend).toFixed(1)}%
          </span>
          {trendLabel && <span className="text-2xs text-surface-500">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
