import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { removeNotification } from '../redux/slices/uiSlice'

const COLORS = {
  success: { icon: '#3FB950', text: '#3FB950', border: 'rgba(63, 185, 80, 0.2)' },
  error: { icon: '#F85149', text: '#F85149', border: 'rgba(248, 81, 73, 0.2)' },
  warning: { icon: '#D29922', text: '#D29922', border: 'rgba(210, 153, 34, 0.2)' },
  info: { icon: '#58A6FF', text: '#58A6FF', border: 'rgba(88, 166, 255, 0.2)' }
}

const ICONS = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}

export default function ToastContainer() {
  const dispatch = useDispatch()
  const notifications = useSelector((state) => state.ui.notifications)

  useEffect(() => {
    if (notifications.length === 0) return
    const timers = notifications.map((n) => setTimeout(() => dispatch(removeNotification(n.id)), 5000))
    return () => timers.forEach(clearTimeout)
  }, [notifications, dispatch])

  if (notifications.length === 0) return null

  return (
    <div className="fixed right-4 top-16 z-50 flex flex-col gap-2" role="alert" aria-live="polite">
      {notifications.map((n) => {
        const c = COLORS[n.type] || COLORS.info
        return (
          <div key={n.id}
            className="flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all min-w-[280px] max-w-[400px] animate-slide-down"
            style={{ backgroundColor: '#161B22', borderColor: c.border, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
            <svg className="h-5 w-5 shrink-0 mt-0.5" style={{ color: c.icon }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[n.type] || ICONS.info} />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#C9D1D9' }}>{n.title}</p>
              <p className="text-xs" style={{ color: '#8B949E' }}>{n.message}</p>
            </div>
            <button type="button" onClick={() => dispatch(removeNotification(n.id))}
              className="shrink-0 rounded p-1" style={{ color: '#6E7681' }}
              aria-label="Cerrar">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
