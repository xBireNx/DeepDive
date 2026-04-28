import { useState, useEffect } from 'react'
import { useStore } from '../../store'

const TREND_COLOR = {
  'Strongly Bullish': 'var(--green)',
  'Bullish': '#4ade80',
  'Bearish': '#fb923c',
  'Strongly Bearish': 'var(--red)',
}

export default function MutualFundsTab({ data }) {
  const [mf, setMf] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  const symbol = data?.symbol

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setErr(null)
    fetch(`/api/mf/${symbol}`)
      .then(r => r.json())
      .then(res => {
        if (res.ok) setMf(res.data)
        else setErr(res.error || 'Failed to fetch MF data')
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [symbol])

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">⊞</div>
      <div className="empty-text">Select a stock first</div>
    </div>
  )

  if (loading) return (
    <div className="empty-state">
      <div className="empty-icon">◌</div>
      <div className="empty-text">Loading Mutual Fund data…</div>
    </div>
  )

  if (err) return (
    <div className="empty-state">
      <div className="empty-icon">⚠</div>
      <div className="empty-text">Error: {err}</div>
    </div>
  )

  if (!mf) return null

  const trendColor = TREND_COLOR[mf.trend] || 'var(--muted)'
  const isNet = mf.net_shares_changed >= 0

  const buyers  = mf.changes.filter(c => c.impact === 'Positive')
  const sellers = mf.changes.filter(c => c.impact === 'Negative')

  return (
    <div className="fade-in">
      <div className="sec">
        <span className="sec-l">Mutual Fund Activity — {mf.symbol}</span>
        <div className="sec-line"/>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>{mf.changes[0]?.month}</span>
      </div>

      {/* --- KPI bar --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Net Flow', value: `${isNet ? '+' : ''}${(mf.net_shares_changed/1e6).toFixed(2)}M sh`, color: isNet ? 'var(--green)' : 'var(--red)' },
          { label: 'Net Value', value: `₹${Math.abs(mf.net_value_cr).toFixed(1)} Cr`, color: isNet ? 'var(--green)' : 'var(--red)' },
          { label: 'Active Funds', value: `${mf.total_funds_active}`, color: 'var(--brand)' },
          { label: 'Sentiment', value: mf.trend, color: trendColor },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '12px 14px', borderLeft: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* --- Summary card --- */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title">AI-Style Summary</div>
        <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text)', marginBottom: 10 }}>{mf.summary}</p>
        {mf.insights.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {mf.insights.map((ins, i) => (
              <li key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5, lineHeight: 1.6 }}>
                {ins}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- Buyers vs Sellers bar --- */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 8 }}>Buyer vs Seller Distribution</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 9, color: 'var(--green)', width: 60 }}>{buyers.length} Buyers</span>
          <div style={{ flex: 1, height: 10, background: 'var(--bg4)', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${(buyers.length/mf.total_funds_active)*100}%`, background: 'var(--green)', borderRadius: '6px 0 0 6px', transition: 'width 0.5s' }}/>
            <div style={{ flex: 1, background: 'var(--red)', borderRadius: '0 6px 6px 0' }}/>
          </div>
          <span style={{ fontSize: 9, color: 'var(--red)', width: 60, textAlign: 'right' }}>{sellers.length} Sellers</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 9, color: 'var(--muted)' }}>Total buying: {buyers.reduce((s,c)=>s+c.shares,0).toLocaleString()} shares</span>
          <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 'auto' }}>Total selling: {sellers.reduce((s,c)=>s+c.shares,0).toLocaleString()} shares</span>
        </div>
      </div>

      {/* --- Detailed table --- */}
      <div className="card">
        <div className="card-title">AMC Activity Log</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Month','Fund','Action','Shares','Avg Price','Value (Cr)','% of Fund'].map(h => (
                  <th key={h} style={{ fontSize: 8, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', textAlign: h==='Month'||h==='Fund' ? 'left' : 'right', padding: '10px 10px', borderBottom: '1px solid var(--b2)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mf.changes.map((c, i) => {
                const isPos = c.impact === 'Positive'
                const isBig = c.action === 'New Entry' || c.action === 'Complete Exit'
                return (
                  <tr key={i}
                    style={{ transition: 'background 0.1s', background: isBig ? (isPos ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)') : '' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--g3)'}
                    onMouseLeave={e => e.currentTarget.style.background = isBig ? (isPos ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)') : ''}
                  >
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--b2)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{c.month}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--b2)', fontWeight: 600 }}>
                      {c.fund}
                      {isBig && <span style={{ marginLeft: 6, fontSize: 8, padding: '1px 5px', borderRadius: 3, background: isPos ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: isPos ? 'var(--green)' : 'var(--red)' }}>{c.action === 'New Entry' ? '★ NEW' : '✕ EXIT'}</span>}
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--b2)', textAlign: 'right', color: isPos ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{c.action}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--b2)', textAlign: 'right' }}>{c.shares.toLocaleString()}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--b2)', textAlign: 'right', color: 'var(--muted)' }}>₹{c.avg_price.toFixed(2)}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--b2)', textAlign: 'right', fontWeight: 600 }}>₹{c.value_cr.toFixed(2)}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--b2)', textAlign: 'right', color: 'var(--muted)' }}>{c.pct_of_fund}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
