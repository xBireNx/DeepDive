import { useState, useEffect } from 'react'
import { useStore } from '../../store'

export default function Compare() {
  const { watchlist, backendLive } = useStore()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!backendLive || watchlist.length === 0) return
    let active = true

    const fetchBatch = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers: watchlist.slice(0, 5) })
        })
        const json = await res.json()
        if (json.ok && active) {
          const arr = []
          for (const key in json.results) {
            if (json.results[key].ok) {
              arr.push(json.results[key].data)
            }
          }
          setData(arr)
        }
      } catch (e) { /* ignore */ }
      finally { if (active) setLoading(false) }
    }
    fetchBatch()
    return () => { active = false }
  }, [watchlist, backendLive])

  if (!backendLive) return (
    <div className="empty-state">
      <div className="empty-icon">⇋</div>
      <div className="empty-text">Backend offline</div>
      <div className="empty-hint">Start the server to compare stocks</div>
    </div>
  )

  if (watchlist.length === 0) return (
    <div className="empty-state">
      <div className="empty-icon">⇋</div>
      <div className="empty-text">Add stocks to your watchlist</div>
      <div className="empty-hint">Compare stocks from your watchlist</div>
    </div>
  )

  if (loading && data.length === 0) return (
    <div className="loading-state">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <div className="loading-text">Loading comparison data...</div>
    </div>
  )

  const thStyle = {
    padding: '14px 16px',
    borderBottom: '2px solid var(--border)',
    fontWeight: 700,
    fontSize: 12,
    textAlign: 'left'
  }

  const tdStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    fontSize: 13
  }

  const sectionStyle = {
    ...tdStyle,
    background: 'var(--surface-elevated)',
    fontWeight: 700,
    fontSize: 11,
    color: 'var(--text-dim)',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-elevated)' }}>
        <div className="card-title" style={{ marginBottom: 4 }}>Multi-Stock Comparison</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Comparing {data.length} stocks from your watchlist</div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 140, background: 'var(--surface-elevated)' }}>Metric</th>
              {data.map(d => (
                <th key={d.symbol} style={{ ...thStyle }}>
                  <div style={{ fontSize: 18, color: 'var(--primary)', fontWeight: 700 }}>{d.symbol}</div>
                  <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-dim)', marginTop: 4 }}>₹{d.price?.current || '--'}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={data.length + 1} style={sectionStyle}>Valuation</td></tr>
            <tr>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>P/E Ratio</td>
              {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.pe?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>P/B Ratio</td>
              {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.pb?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>EV/EBITDA</td>
              {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.ev_ebitda?.toFixed(2) || '--'}</td>)}
            </tr>

            <tr><td colSpan={data.length + 1} style={sectionStyle}>Profitability</td></tr>
            <tr>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>ROE (%)</td>
              {data.map(d => <td key={d.symbol} style={{ ...tdStyle, color: (d.ratios?.roe || 0) > 15 ? 'var(--success)' : (d.ratios?.roe || 0) > 10 ? 'var(--warning)' : 'var(--error)' }}>{d.ratios?.roe?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>ROA (%)</td>
              {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.roa?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>Net Margin (%)</td>
              {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.netMargin?.toFixed(2) || '--'}</td>)}
            </tr>

            <tr><td colSpan={data.length + 1} style={sectionStyle}>Growth & Health</td></tr>
            <tr>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>Revenue Growth (%)</td>
              {data.map(d => <td key={d.symbol} style={{ ...tdStyle, color: (d.ratios?.revGrowth || 0) > 15 ? 'var(--success)' : 'inherit' }}>{d.ratios?.revGrowth?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>Debt to Equity</td>
              {data.map(d => <td key={d.symbol} style={{ ...tdStyle, color: (d.ratios?.de || 0) < 0.5 ? 'var(--success)' : (d.ratios?.de || 0) < 1 ? 'var(--warning)' : 'var(--error)' }}>{d.ratios?.de?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>DeepDive Score</td>
              {data.map(d => (
                <td key={d.symbol} style={{ ...tdStyle, color: d.fundamental?.overallPct > 70 ? 'var(--success)' : d.fundamental?.overallPct < 40 ? 'var(--error)' : 'var(--warning)', fontWeight: 700 }}>
                  {d.fundamental?.overallPct ? `${d.fundamental.overallPct.toFixed(0)}%` : '--'}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>Tech Trend</td>
              {data.map(d => (
                <td key={d.symbol} style={{ ...tdStyle, color: d.technical?.trend?.includes('Bullish') ? 'var(--success)' : d.technical?.trend?.includes('Bearish') ? 'var(--error)' : 'var(--warning)', fontWeight: 600 }}>
                  {d.technical?.trend || '--'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}