import { useEffect, useRef } from 'react'

export default function DetailPanel({ open, onClose, title, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />}
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title}
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}>
        <div className="flex items-center justify-between px-5 h-14 border-b" style={{ borderColor: '#30363D' }}>
          <h2 className="text-sm font-semibold truncate" style={{ color: '#C9D1D9' }}>{title || 'Detalles'}</h2>
          <button type="button" onClick={onClose}
            className="rounded-lg p-2 transition-colors" style={{ color: '#8B949E' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#C9D1D9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#8B949E'}
            aria-label="Cerrar">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-3.5rem)] p-5">
          {children || (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm" style={{ color: '#6E7681' }}>Selecciona un elemento para ver detalles</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
