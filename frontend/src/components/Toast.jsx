import { useState, useCallback } from 'react'

let _showToast = null

export function Toast() {
  const [toasts, setToasts] = useState([])

  _showToast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800)
  }, [])

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{ color: t.type === 'error' ? 'var(--red)' : 'var(--green)' }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

export const showToast = (msg, type) => _showToast?.(msg, type)
