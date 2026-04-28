import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store'
import { fN, gradeColor, trendClass, drawSparkline } from '../../utils'
import { showToast } from '../Toast'

function SparklineCanvas({ data }) {
  const ref = useRef(null)
  useEffect(() => { drawSparkline(ref.current, data) }, [data])
  return <canvas ref={ref} className="sparkline" />
}

function WatchlistItem({ symbol, isActive, onSelect, onRemove }) {
  const { stockCache, isLoading, conviction, toggleConviction } = useStore()
  const d = stockCache[symbol]
  const loading = isLoading(symbol)

  if (loading) return (
    <div className="wl-item" style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} />
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Analyzing {symbol}...</span>
      </div>
    </div>
  )

  if (!d) return (
    <div className={`wl-item${isActive ? ' active' : ''}`} onClick={() => onSelect(symbol)}>
      <button className="wl-remove" onClick={e => { e.stopPropagation(); onRemove(symbol) }}>✕</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span className="wl-ticker">{symbol}</span>
        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Tap to analyze</span>
      </div>
      <div className="wl-name">Not yet analyzed</div>
    </div>
  )

  const isPos = (d.price?.ret1m || 0) >= 0
  const cv = conviction[symbol] || 'medium'
  const gr = d.fundamental?.grade?.[0]?.toLowerCase() || 'c'
  const trd = d.technical?.longPct >= 60 ? 'up' : d.technical?.longPct <= 40 ? 'down' : 'side'
  const ph = d.priceHistory?.map(h => h.close) || []

  return (
    <div className={`wl-item${isActive ? ' active' : ''}`} onClick={() => onSelect(symbol)}>
      <div className={`conv-bar conv-${cv}`} />
      <button className="wl-remove" onClick={e => { e.stopPropagation(); onRemove(symbol) }}>✕</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span className="wl-ticker">{symbol}</span>
        <span className="wl-price" style={{ color: isPos ? 'var(--green)' : 'var(--red)' }}>
          ₹{(d.price?.current || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="wl-name" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.company?.name || symbol}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: isPos ? 'var(--green)' : 'var(--red)' }}>
          {isPos ? '+' : ''}{(d.price?.ret1m || 0).toFixed(1)}% 1M
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <span
          className="tag"
          style={{
            color: gradeColor(d.fundamental?.grade),
            borderColor: `${gradeColor(d.fundamental?.grade)}40`,
            background: `${gradeColor(d.fundamental?.grade)}12`
          }}
        >
          {d.fundamental?.grade?.split(' ')[0] || '?'}
        </span>
        <span className={`tag tag-${trd === 'up' ? 'g' : trd === 'down' ? 'r' : 'y'}`}>
          {d.technical?.trend?.split(' ')[0] || '—'}
        </span>
        <span className="tag tag-m">PE {fN(d.ratios?.pe, '', 'x', 1)}</span>
        <button
          className="tag"
          style={{ cursor: 'pointer', color: cv === 'high' ? 'var(--green)' : cv === 'low' ? 'var(--text-dim)' : 'var(--warning)', borderColor: 'var(--border)', background: 'transparent' }}
          onClick={e => { e.stopPropagation(); toggleConviction(symbol) }}
        >
          {cv.toUpperCase()}
        </button>
      </div>
      {ph.length > 0 && <SparklineCanvas data={ph} />}
    </div>
  )
}

export default function Sidebar({ isOpen, onClose, onAddClick, activeTab, onTabChange }) {
  const { watchlist, stockCache, portfolio, analyseStock, removeFromWatchlist, setActiveStock } = useStore()

  const handleSelect = async (symbol) => {
    if (stockCache[symbol]) {
      setActiveStock(symbol)
      if (window.innerWidth <= 768) onClose()
    } else {
      if (!useStore.getState().backendLive) {
        showToast('Backend offline. Run: python server.py', 'error')
        return
      }
      try { await analyseStock(symbol) }
      catch (e) { showToast(e.message, 'error') }
    }
    if (window.innerWidth <= 768) onClose()
  }

  let totalInv = 0, totalCurr = 0
  portfolio.forEach(h => {
    const d = stockCache[h.ticker]
    totalInv += h.qty * h.buyPrice
    totalCurr += h.qty * (d?.price?.current || h.buyPrice)
  })
  const pnl = totalCurr - totalInv
  const pnlPct = totalInv > 0 ? pnl / totalInv * 100 : 0

  return (
    <div className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sb-hd">
        <span className="sb-title">Market Watch</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="sb-add-btn" onClick={onAddClick}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add
          </button>
          {window.innerWidth <= 768 && (
            <button className="btn-outline" style={{ padding: '8px 12px' }} onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="wl-scroll">
        {watchlist.map(sym => (
          <WatchlistItem
            key={sym}
            symbol={sym}
            isActive={useStore.getState().activeStock === sym}
            onSelect={handleSelect}
            onRemove={(s) => { removeFromWatchlist(s); showToast(`${s} removed`) }}
          />
        ))}
        {watchlist.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>📊</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>Your watchlist is empty</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Search for stocks to begin analysis</div>
          </div>
        )}
      </div>

      <div className="sb-portfolio">
        <div className="sb-portfolio-header">Portfolio Summary</div>
        {portfolio.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No active holdings</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Invested</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>₹{totalInv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: pnl >= 0 ? 'var(--success)' : 'var(--error)' }}>
                ₹{totalCurr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total P&L</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: pnl >= 0 ? 'var(--success-muted)' : 'var(--error-muted)',
                  color: pnl >= 0 ? 'var(--success)' : 'var(--error)'
                }}
              >
                {pnl >= 0 ? '↑' : '↓'} {Math.abs(pnlPct).toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}