import { useState, useEffect } from 'react'
import { useStore, API } from '../../store'

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
        const res = await fetch(`${API}/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers: watchlist.slice(0, 5) })
        })
        const json = await res.json()
        if (json.ok && active) {
          const arr = []
          for (const key in json.results) {
            if (json.results[key].ok) arr.push(json.results[key].data)
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
      <div className="empty-title">Backend offline</div>
    </div>
  )

  if (watchlist.length === 0) return (
    <div className="empty-state">
      <div className="empty-icon">⇋</div>
      <div className="empty-title">Add stocks to watchlist</div>
    </div>
  )

  if (loading && data.length === 0) return (
    <div className="empty-state">
      <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div className="empty-title">Loading...</div>
    </div>
  )

  return (
    <div style={{ padding: '0 0 20px 0' }}>
      <div style={{ 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-default)', 
        borderRadius: 14, 
        padding: 16, 
        marginBottom: 16 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Compare</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>{data.length} stocks</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-dim)', textAlign: 'left', width: 120 }}>Metric</th>
              {data.map(d => (
                <th key={d.symbol} style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <div style={{ fontSize: 16, color: 'var(--accent-primary)', fontWeight: 800 }}>{d.symbol}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>₹{d.price?.current || '--'}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={data.length + 1} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', fontWeight: 700, color: 'var(--text-dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Valuation</td></tr>
            <tr>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>P/E</td>
              {data.map(d => <td key={d.symbol} style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{d.ratios?.pe?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>P/B</td>
              {data.map(d => <td key={d.symbol} style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{d.ratios?.pb?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>EV/EBITDA</td>
              {data.map(d => <td key={d.symbol} style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{d.ratios?.ev_ebitda?.toFixed(2) || '--'}</td>)}
            </tr>

            <tr><td colSpan={data.length + 1} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', fontWeight: 700, color: 'var(--text-dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Profitability</td></tr>
            <tr>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>ROE %</td>
              {data.map(d => <td key={d.symbol} style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: (d.ratios?.roe || 0) > 15 ? 'var(--gain)' : (d.ratios?.roe || 0) > 8 ? 'var(--warning)' : 'var(--loss)' }}>{d.ratios?.roe?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Net Margin %</td>
              {data.map(d => <td key={d.symbol} style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{d.ratios?.profit_margin?.toFixed(2) || '--'}</td>)}
            </tr>

            <tr><td colSpan={data.length + 1} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', fontWeight: 700, color: 'var(--text-dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Growth & Health</td></tr>
            <tr>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Rev Growth %</td>
              {data.map(d => <td key={d.symbol} style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: (d.ratios?.revenue_growth || 0) > 15 ? 'var(--gain)' : 'inherit' }}>{d.ratios?.revenue_growth?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Debt/Equity</td>
              {data.map(d => <td key={d.symbol} style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: (d.ratios?.debt_to_equity || 0) < 0.5 ? 'var(--gain)' : (d.ratios?.debt_to_equity || 0) < 1 ? 'var(--warning)' : 'var(--loss)' }}>{d.ratios?.debt_to_equity?.toFixed(2) || '--'}</td>)}
            </tr>
            <tr>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Score</td>
              {data.map(d => (
                <td key={d.symbol} style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: d.fundamental?.overallPct > 70 ? 'var(--gain)' : d.fundamental?.overallPct < 40 ? 'var(--loss)' : 'var(--warning)' }}>
                  {d.fundamental?.overallPct ? `${d.fundamental.overallPct.toFixed(0)}%` : '--'}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Tech Trend</td>
              {data.map(d => (
                <td key={d.symbol} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: d.technical?.trend?.includes('Bullish') ? 'var(--gain)' : d.technical?.trend?.includes('Bearish') ? 'var(--loss)' : 'var(--warning)' }}>
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