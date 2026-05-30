export default function MetricCard({ label, value, unit, trend, trendLabel, icon, color = 'blue', loading, onClick }) {
  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-3 w-16 rounded" style={{ backgroundColor: '#21262D' }} />
        <div className="mt-3 h-7 w-12 rounded" style={{ backgroundColor: '#21262D' }} />
      </div>
    )
  }

  const colorMap = {
    blue: { text: '#58A6FF', bg: 'rgba(88, 166, 255, 0.1)', border: 'rgba(88, 166, 255, 0.2)' },
    green: { text: '#3FB950', bg: 'rgba(63, 185, 80, 0.1)', border: 'rgba(63, 185, 80, 0.2)' },
    yellow: { text: '#D29922', bg: 'rgba(210, 153, 34, 0.1)', border: 'rgba(210, 153, 34, 0.2)' },
    red: { text: '#F85149', bg: 'rgba(248, 81, 73, 0.1)', border: 'rgba(248, 81, 73, 0.2)' },
    purple: { text: '#BC8CFF', bg: 'rgba(188, 140, 255, 0.1)', border: 'rgba(188, 140, 255, 0.2)' },
  }
  const c = colorMap[color] || colorMap.blue

  const Card = onClick ? 'button' : 'div'
  const clickProps = onClick ? {
    onClick,
    type: 'button',
    className: 'card-hover p-4 rounded-xl text-left w-full'
  } : {
    className: 'card-hover p-4 rounded-xl'
  }

  return (
    <Card {...clickProps}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="kpi-label text-2xs sm:text-xs">{label}</p>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="kpi-value text-xl sm:text-2xl">{value ?? '---'}</span>
            {unit && <span className="text-xs font-medium" style={{ color: '#6E7681' }}>{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: c.text }}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </div>
        )}
      </div>
      {trend !== undefined && trend !== null && (
        <div className="mt-2 flex items-center gap-1">
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <svg className={`h-3 w-3 ${trend >= 0 ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {Math.abs(trend).toFixed(1)}%
          </span>
          {trendLabel && <span className="text-2xs" style={{ color: '#6E7681' }}>{trendLabel}</span>}
        </div>
      )}
    </Card>
  )
}
