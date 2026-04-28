import { useState, useEffect, useRef } from 'react'
import { useStore, api } from '../../store'
import { showToast } from '../Toast'

export default function Topbar({ onHamburger }) {
  const { backendLive, setBackendLive, analyseStock, addToWatchlist, toggleTheme } = useStore()
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef(null)
  const searchTimeout = useRef(null)
  const [query, setQuery] = useState('')

  // Clock
  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setTime(`${n.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${n.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Backend health check
  useEffect(() => {
    const check = async () => {
      const r = await api.status()
      setBackendLive(!!r)
    }
    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

  // Search debounce
  useEffect(() => {
    clearTimeout(searchTimeout.current)
    if (!query || query.length < 1) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      if (backendLive) {
        const r = await api.search(query).catch(() => [])
        setSearchResults(r.slice(0, 6))
        if (r.length) setShowSearch(true)
      }
    }, 300)
  }, [query, backendLive])

  // Close search on outside click
  useEffect(() => {
    const h = (e) => { if (!searchRef.current?.contains(e.target)) setShowSearch(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  const doAnalyse = async (sym) => {
    const s = sym?.trim().toUpperCase() || ticker.trim().toUpperCase()
    if (!s) return
    if (!backendLive) { showToast('⚠ Backend offline. Run: python server.py', 'error'); return }
    setLoading(true)
    setShowSearch(false)
    setQuery('')
    addToWatchlist(s)
    try {
      await analyseStock(s)
      showToast(`✓ ${s} analysed`)
    } catch (e) {
      showToast(`⚠ ${e.message}`, 'error')
    } finally {
      setLoading(false)
      setTicker('')
    }
  }

  return (
    <div className="topbar">
      <button className="hamburger" onClick={onHamburger} aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="logo">
        <div className="logo-dot"/>
        <span>DeepDive</span>
      </div>

      {/* Search bar */}
      <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: 16 }}>⌕</span>
          <input
            className="input"
            style={{ paddingLeft: 40, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}
            placeholder="Search NSE stocks…"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSearch(true) }}
            onKeyDown={e => { if (e.key === 'Enter' && query) doAnalyse(query) }}
          />
        </div>
        {showSearch && searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border-bright)', borderRadius: 10, zIndex: 200, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            {searchResults.map(r => (
              <div key={r.symbol} onClick={() => doAnalyse(r.symbol?.replace('.NS','').replace('.BO',''))}
                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, width: 90 }}>{r.symbol}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tb-right">
        <button className="export-btn" onClick={() => toggleTheme()} aria-label="Toggle theme">Theme</button>
        <button className="export-btn" onClick={() => { document.title = `DeepDive Report ${new Date().toLocaleDateString('en-IN')}`; window.print() }}>Export PDF</button>
        <div className="tb-status">
          <div className={`status-dot ${backendLive ? 'live' : ''}`}/>
          <span style={{ fontSize: 12, color: backendLive ? 'var(--success)' : 'var(--text-dim)' }}>
            {backendLive ? 'Live' : 'Offline'}
          </span>
        </div>
        <div className="tb-time">
          {time}
        </div>
      </div>
    </div>
  )
}
