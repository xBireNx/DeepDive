import { useState, useEffect } from 'react'
import { useStore, API } from '../../store'

const TREND_COLOR = {
  'Strongly Bullish': 'var(--gain)',
  'Bullish': '#4ade80',
  'Bearish': '#fb923c',
  'Strongly Bearish': 'var(--loss)',
}

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function MutualFundsTab({ data }) {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  const [mf, setMf] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  const symbol = data?.symbol

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setErr(null)
    fetch(`${API}/mf/${symbol}`)
      .then(r => r.json())
      .then(res => {
        if (res.ok) setMf(res.data)
        else setErr(res.error || 'Failed')
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [symbol])

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">⊞</div>
      <div className="empty-title">Select a stock first</div>
    </div>
  )

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div className="empty-title">Loading...</div>
    </div>
  )

  if (err) return (
    <div className="empty-state">
      <div className="empty-icon">⚠</div>
      <div className="empty-title">{err}</div>
    </div>
  )

  if (!mf) return null

  const trendColor = TREND_COLOR[mf.trend] || 'var(--text-dim)'
  const isNet = mf.net_shares_changed >= 0
  const buyers = mf.changes.filter(c => c.impact === 'Positive')
  const sellers = mf.changes.filter(c => c.impact === 'Negative')

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
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{mf.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>Mutual Funds</span>
          </div>
          <span style={{ fontSize: 10, padding: '4px 8px', background: `${trendColor}20`, color: trendColor, borderRadius: 6, fontWeight: 700 }}>
            {mf.trend}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Net Flow', value: `${isNet ? '+' : ''}${(mf.net_shares_changed/1e6).toFixed(2)}M sh`, color: isNet ? 'var(--gain)' : 'var(--loss)' },
          { label: 'Net Value', value: `₹${Math.abs(mf.net_value_cr).toFixed(1)} Cr`, color: isNet ? 'var(--gain)' : 'var(--loss)' },
          { label: 'Funds', value: `${mf.total_funds_active}`, color: 'var(--accent-primary)' },
          { label: 'Trend', value: mf.trend, color: trendColor },
        ].map(k => (
          <div key={k.label} className="panel" style={{ padding: 10, borderLeft: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 2 }}>{k.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <SecHeader label="Summary" collapsed={collapsed.summary} onToggle={() => toggleSection('summary')} />
      {!collapsed.summary && (
        <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 10 }}>{mf.summary}</div>
          {mf.insights.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {mf.insights.map((ins, i) => (
                <li key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>{ins}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <SecHeader label="Buyers vs Sellers" collapsed={collapsed.dist} onToggle={() => toggleSection('dist')} />
      {!collapsed.dist && (
        <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--gain)', width: 50 }}>{buyers.length} Buyers</span>
            <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(buyers.length/mf.total_funds_active)*100}%`, background: 'var(--gain)', borderRadius: '4px 0 0 4px' }} />
              <div style={{ flex: 1, background: 'var(--loss)', borderRadius: '0 4px 4px 0' }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--loss)', width: 50, textAlign: 'right' }}>{sellers.length} Sellers</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 9, color: 'var(--text-dim)' }}>
            <span>Buy: {buyers.reduce((s, c) => s + c.shares, 0).toLocaleString()} sh</span>
            <span style={{ marginLeft: 'auto' }}>Sell: {sellers.reduce((s, c) => s + c.shares, 0).toLocaleString()} sh</span>
          </div>
        </div>
      )}

      <SecHeader label="AMC Activity" collapsed={collapsed.log} onToggle={() => toggleSection('log')} />
      {!collapsed.log && (
        <div className="panel" style={{ padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                {['Month', 'Fund', 'Action', 'Shares', 'Avg Price', 'Value', '%'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Month' || h === 'Fund' ? 'left' : 'right', color: 'var(--text-dim)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mf.changes.map((c, i) => {
                const isPos = c.impact === 'Positive'
                const isBig = c.action === 'New Entry' || c.action === 'Complete Exit'
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', background: isBig ? (isPos ? 'var(--gain-dim)' : 'var(--loss-dim)') : 'transparent' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--text-dim)' }}>{c.month}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                      {c.fund}
                      {isBig && <span style={{ marginLeft: 6, fontSize: 8, padding: '1px 4px', borderRadius: 3, background: isPos ? 'var(--gain)' : 'var(--loss)', color: '#000' }}>{isPos ? 'NEW' : 'EXIT'}</span>}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: isPos ? 'var(--gain)' : 'var(--loss)', fontWeight: 600 }}>{c.action}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{c.shares.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-dim)' }}>₹{c.avg_price.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>₹{c.value_cr.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-dim)' }}>{c.pct_of_fund}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}