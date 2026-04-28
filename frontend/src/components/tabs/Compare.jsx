import { useState, useEffect } from 'react'
import { useStore, api } from '../../store'

export default function Compare() {
  const { watchlist, backendLive } = useStore()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!backendLive || watchlist.length === 0) return
    let active = true

    const fetchBatch = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers: watchlist.slice(0, 5) }) // Compare up to 5
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
      } catch (e) {
        if (active) setError(e.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchBatch()
    return () => { active = false }
  }, [watchlist, backendLive])

  if (!backendLive) {
    return <div className="tab-pane"><div className="empty-state">Backend offline. Please start the server.</div></div>
  }
  if (watchlist.length === 0) {
    return <div className="tab-pane"><div className="empty-state">Add stocks to your watchlist to compare them.</div></div>
  }
  if (loading && data.length === 0) {
    return <div className="tab-pane"><div className="empty-state">Loading comparison data...</div></div>
  }

  return (
    <div className="tab-pane fade-in">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Multi-Stock Comparison</h3>
          <span style={{fontSize: 12, color: 'var(--muted)'}}>Comparing {data.length} stocks from your watchlist</span>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          <table className="comparison-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={thStyle}>Metric</th>
                {data.map(d => (
                  <th key={d.symbol} style={thStyle}>
                    <div style={{fontSize: 16, color: 'var(--brand)'}}>{d.symbol}</div>
                    <div style={{fontSize: 11, fontWeight: 'normal', color: 'var(--muted)'}}>₹{d.price?.current || '--'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={data.length + 1} style={{...tdStyle, background: 'var(--bg-lighter)', fontWeight: 600, fontSize: 12, color: 'var(--muted)'}}>VALUATION</td>
              </tr>
              <tr>
                <td style={tdStyle}>P/E Ratio</td>
                {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.pe?.toFixed(2) || '--'}</td>)}
              </tr>
              <tr>
                <td style={tdStyle}>P/B Ratio</td>
                {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.pb?.toFixed(2) || '--'}</td>)}
              </tr>
              <tr>
                <td style={tdStyle}>EV/EBITDA</td>
                {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.ev_ebitda?.toFixed(2) || '--'}</td>)}
              </tr>

              <tr>
                <td colSpan={data.length + 1} style={{...tdStyle, background: 'var(--bg-lighter)', fontWeight: 600, fontSize: 12, color: 'var(--muted)'}}>PROFITABILITY</td>
              </tr>
              <tr>
                <td style={tdStyle}>ROE (%)</td>
                {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.roe?.toFixed(2) || '--'}</td>)}
              </tr>
              <tr>
                <td style={tdStyle}>ROA (%)</td>
                {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.roa?.toFixed(2) || '--'}</td>)}
              </tr>
              <tr>
                <td style={tdStyle}>Net Margin (%)</td>
                {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.netMargin?.toFixed(2) || '--'}</td>)}
              </tr>

              <tr>
                <td colSpan={data.length + 1} style={{...tdStyle, background: 'var(--bg-lighter)', fontWeight: 600, fontSize: 12, color: 'var(--muted)'}}>GROWTH & HEALTH</td>
              </tr>
              <tr>
                <td style={tdStyle}>Revenue Growth (%)</td>
                {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.revGrowth?.toFixed(2) || '--'}</td>)}
              </tr>
              <tr>
                <td style={tdStyle}>Debt to Equity</td>
                {data.map(d => <td key={d.symbol} style={tdStyle}>{d.ratios?.de?.toFixed(2) || '--'}</td>)}
              </tr>
              <tr>
                <td style={tdStyle}>DeepDive Score (%)</td>
                {data.map(d => (
                  <td key={d.symbol} style={{...tdStyle, color: d.fundamental?.overallPct > 70 ? 'var(--up)' : d.fundamental?.overallPct < 40 ? 'var(--down)' : 'inherit'}}>
                    {d.fundamental?.overallPct || '--'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Tech Trend</td>
                {data.map(d => (
                  <td key={d.symbol} style={{...tdStyle, color: d.technical?.trend?.includes('Bullish') ? 'var(--up)' : d.technical?.trend?.includes('Bearish') ? 'var(--down)' : 'inherit'}}>
                    {d.technical?.trend || '--'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const thStyle = {
  padding: '12px 15px',
  borderBottom: '2px solid var(--border)',
  fontWeight: 600,
  minWidth: '120px'
}

const tdStyle = {
  padding: '12px 15px',
  borderBottom: '1px solid var(--border)'
}
