import { useEffect, useRef } from 'react'
import { useStore } from '../../store'
import { fN, gradeColor, drawSparkline } from '../../utils'
import { showToast } from '../Toast'

function SparklineCanvas({ data }) {
  const ref = useRef(null)
  useEffect(() => { drawSparkline(ref.current, data) }, [data])
  return <canvas ref={ref} className="wl-spark" />
}

function WatchlistItem({ symbol, isActive, onSelect, onRemove }) {
  const { stockCache, isLoading, conviction, toggleConviction } = useStore()
  const d = stockCache[symbol]
  const loading = isLoading(symbol)

  if (loading) return (
    <div className="watchlist-item" style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="spinner" />
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Analyzing {symbol}...</span>
      </div>
    </div>
  )

  if (!d) return (
    <div className={`watchlist-item${isActive ? ' active' : ''}`} onClick={() => onSelect(symbol)}>
      <button className="wl-remove" onClick={e => { e.stopPropagation(); onRemove(symbol) }}>✕</button>
      <div className="wl-ticker">{symbol}</div>
      <div className="wl-name">Tap to analyze</div>
    </div>
  )

  const isPos = (d.price?.ret1m || 0) >= 0
  const cv = conviction[symbol] || 'medium'
  const ph = d.priceHistory?.map(h => h.close) || []

  return (
    <div className={`watchlist-item${isActive ? ' active' : ''}`} onClick={() => onSelect(symbol)}>
      <button className="wl-remove" onClick={e => { e.stopPropagation(); onRemove(symbol) }}>✕</button>
      <div className="wl-ticker">{symbol}</div>
      <div className="wl-name">{d.company?.name || symbol}</div>
      <div className="wl-price-row">
        <span className="wl-price" style={{ color: isPos ? 'var(--gain)' : 'var(--loss)' }}>
          ₹{(d.price?.current || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
        <span className={`wl-change ${isPos ? 'positive' : 'negative'}`}>
          {isPos ? '+' : ''}{(d.price?.ret1m || 0).toFixed(1)}%
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        <span className="badge" style={{ 
          background: `${gradeColor(d.fundamental?.grade)}20`, 
          color: gradeColor(d.fundamental?.grade) 
        }}>
          {d.fundamental?.grade?.split(' ')[0] || '—'}
        </span>
        <button
          className="badge"
          style={{ cursor: 'pointer', background: cv === 'high' ? 'var(--gain-dim)' : cv === 'low' ? 'var(--bg-tertiary)' : 'var(--warning-dim)', color: cv === 'high' ? 'var(--gain)' : cv === 'low' ? 'var(--text-dim)' : 'var(--warning)' }}
          onClick={e => { e.stopPropagation(); toggleConviction(symbol) }}
        >
          {cv}
        </button>
      </div>
      {ph.length > 0 && <SparklineCanvas data={ph} />}
    </div>
  )
}

export default function Sidebar({ isOpen, onClose, onAddClick }) {
  const { watchlist, stockCache, portfolio, analyseStock, removeFromWatchlist, setActiveStock, activeStock } = useStore()

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
      <div className="sidebar-header">
        <span className="sidebar-title">Market Watch</span>
        <button className="add-stock-btn" onClick={onAddClick}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add
        </button>
      </div>

      <div className="watchlist-container">
        {watchlist.map(sym => (
          <WatchlistItem
            key={sym}
            symbol={sym}
            isActive={activeStock === sym}
            onSelect={handleSelect}
            onRemove={(s) => { removeFromWatchlist(s); showToast(`${s} removed`) }}
          />
        ))}
        {watchlist.length === 0 && (
          <div className="empty-state" style={{ minHeight: 300 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📈</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>No stocks in watchlist</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Search or add stocks to begin</div>
          </div>
        )}
      </div>

      <div className="portfolio-summary">
        <div className="ps-title">Portfolio</div>
        {portfolio.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No holdings</div>
        ) : (
          <div className="ps-values">
            <div className="ps-item">
              <div className="ps-label">Invested</div>
              <div className="ps-value">₹{fN(totalInv / 10000000, '', 'Cr', 2)}</div>
            </div>
            <div className="ps-item">
              <div className="ps-label">Current</div>
              <div className="ps-value" style={{ color: pnl >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                ₹{fN(totalCurr / 10000000, '', 'Cr', 2)}
              </div>
            </div>
            <div className="ps-item" style={{ gridColumn: 'span 2' }}>
              <div className="ps-label">Total P&L</div>
              <div className={`ps-value ${pnl >= 0 ? 'gain' : 'loss'}`}>
                {pnl >= 0 ? '+' : ''}₹{fN(pnl / 10000000, '', 'Cr', 2)} ({pnlPct.toFixed(1)}%)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}