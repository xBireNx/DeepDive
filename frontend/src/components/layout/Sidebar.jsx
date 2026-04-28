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
    <div className="wl-item" style={{ height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>Analysing {symbol}…</span>
      </div>
    </div>
  )

  if (!d) return (
    <div className={`wl-item${isActive ? ' active' : ''}`} onClick={() => onSelect(symbol)}>
      <button className="wl-remove" onClick={e => { e.stopPropagation(); onRemove(symbol) }}>✕</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span className="wl-ticker">{symbol}</span>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>Click to analyse</span>
      </div>
      <div className="wl-name">Not yet analysed</div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span className="wl-ticker">{symbol}</span>
        <span className="wl-price" style={{ color: isPos ? 'var(--green)' : 'var(--red)' }}>
          ₹{(d.price?.current || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="wl-name" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.company?.name || symbol}
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, color: isPos ? 'var(--green)' : 'var(--red)' }}>
          {isPos ? '+' : ''}{(d.price?.ret1m || 0).toFixed(1)}% 1M
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <span className="tag" style={{ color: gradeColor(d.fundamental?.grade), borderColor: `${gradeColor(d.fundamental?.grade)}40`, background: `${gradeColor(d.fundamental?.grade)}12` }}>
          {d.fundamental?.grade?.split(' ')[0] || '?'}
        </span>
        <span className={`tag tag-${trd === 'up' ? 'g' : trd === 'down' ? 'r' : 'y'}`}>
          {d.technical?.trend?.split(' ')[0] || '—'}
        </span>
        <span className="tag tag-m">PE {fN(d.ratios?.pe, '', 'x', 1)}</span>
        <button
          className="tag"
          style={{ cursor: 'pointer', color: cv === 'high' ? 'var(--green)' : cv === 'low' ? 'var(--muted)' : 'var(--yellow)', borderColor: 'var(--b2)', background: 'transparent' }}
          onClick={e => { e.stopPropagation(); toggleConviction(symbol) }}
        >{cv.toUpperCase()}</button>
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
        showToast('⚠ Backend offline. Run: python server.py', 'error')
        return
      }
      try { await analyseStock(symbol) }
      catch (e) { showToast(`⚠ ${e.message}`, 'error') }
    }
    if (window.innerWidth <= 768) onClose()
  }

  // Portfolio mini summary
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
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 11 }} onClick={onAddClick}>+ Add Stock</button>
          {window.innerWidth <= 768 && (
            <button className="btn-outline" style={{ padding: '6px 12px' }} onClick={onClose}>✕</button>
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
          <div style={{ padding: '40px 24px', fontSize: 13, color: 'var(--text-dim)', textAlign: 'center' }}>
            Your watchlist is empty.<br/>
            <span style={{ fontSize: 11, marginTop: 8, display: 'block' }}>Search for stocks to begin analysis.</span>
          </div>
        )}
      </div>

      {/* Portfolio summary */}
      <div className="sb-portfolio">
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Portfolio</div>
        {portfolio.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>No active holdings.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Invested</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>₹{totalInv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: pnl >= 0 ? 'var(--success)' : 'var(--error)' }}>
                ₹{totalCurr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total P&L</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: pnl >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: pnl >= 0 ? 'var(--success)' : 'var(--error)' }}>
                {pnl >= 0 ? '↑' : '↓'} {pnlPct.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
