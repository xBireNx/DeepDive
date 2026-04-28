import { useState, useEffect, useRef } from 'react'
import { useStore, api } from '../../store'
import { showToast } from '../Toast'

export default function Topbar({ onHamburger }) {
  const { backendLive, setBackendLive, analyseStock, addToWatchlist, toggleTheme, exportData, importData } = useStore()
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportRef = useRef(null)
  const searchRef = useRef(null)
  const searchTimeout = useRef(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setTime(n.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + n.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const check = async () => {
      const r = await api.status()
      setBackendLive(!!r)
    }
    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

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

  useEffect(() => {
    const h = (e) => {
      if (!searchRef.current?.contains(e.target)) setShowSearch(false)
      if (!exportRef.current?.contains(e.target)) setShowExportMenu(false)
    }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  const doAnalyse = async (sym) => {
    const s = sym?.trim().toUpperCase() || query.trim().toUpperCase()
    if (!s) return
    if (!backendLive) {
      showToast('Backend offline. Run: python server.py', 'error')
      return
    }
    setLoading(true)
    setShowSearch(false)
    setQuery('')
    addToWatchlist(s)
    try {
      await analyseStock(s)
      showToast(`${s} analyzed`)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    document.title = `DeepDive Report ${new Date().toLocaleDateString('en-IN')}`
    window.print()
    setShowExportMenu(false)
  }

  const handleExportData = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deepdive-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Data exported successfully')
    setShowExportMenu(false)
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const result = importData(ev.target.result)
          if (result.ok) {
            showToast(result.msg)
          } else {
            showToast(result.msg, 'error')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
    setShowExportMenu(false)
  }

  return (
    <div className="topbar">
      <button className="hamburger" onClick={onHamburger} aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="logo">
        <div className="logo-icon">D</div>
        <span>DeepDive</span>
      </div>

      <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
        <div style={{ position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', width: 18, height: 18 }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="input"
            style={{ paddingLeft: 44 }}
            placeholder="Search NSE stocks..."
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSearch(true) }}
            onKeyDown={e => { if (e.key === 'Enter' && query) doAnalyse(query) }}
          />
        </div>
        {showSearch && searchResults.length > 0 && (
          <div className="search-dropdown">
            {searchResults.map(r => (
              <div
                key={r.symbol}
                onClick={() => doAnalyse(r.symbol?.replace('.NS', '').replace('.BO', ''))}
                className="search-result"
              >
                <span className="search-result-symbol">{r.symbol}</span>
                <span className="search-result-name">{r.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tb-right">
        <button className="tb-btn" onClick={toggleTheme} aria-label="Toggle theme">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          <span>Theme</span>
        </button>

        <div ref={exportRef} style={{ position: 'relative' }}>
          <button className="tb-btn" onClick={() => setShowExportMenu(!showExportMenu)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>Export</span>
          </button>
          {showExportMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 300, minWidth: 180 }}>
              <button onClick={handleExportPDF} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                📄 Export as PDF
              </button>
              <button onClick={handleExportData} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                💾 Backup Data (JSON)
              </button>
              <button onClick={handleImportData} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                📂 Restore Data
              </button>
            </div>
          )}
        </div>

        <div className="tb-status">
          <div className={`status-dot ${backendLive ? 'live' : ''}`} />
          <span style={{ color: backendLive ? 'var(--success)' : 'var(--text-dim)' }}>
            {backendLive ? 'Live' : 'Offline'}
          </span>
        </div>
        <div className="tb-time">{time}</div>
      </div>
    </div>
  )
}