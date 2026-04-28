import { useState } from 'react'
import { useStore } from '../../store'
import { fN } from '../../utils'
import { showToast } from '../Toast'

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function Peers({ data }) {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  const { stockCache, analyseStock } = useStore()
  const [peerData, setPeerData] = useState(null)
  const [peerTicker, setPeerTicker] = useState('')
  const [loading, setLoading] = useState(false)

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">⊞</div>
      <div className="empty-title">Select a stock first</div>
    </div>
  )

  const peers = data.peers || []
  const r = data.ratios || {}

  const metrics = [
    { l: 'P/E', v: r.pe, unit: 'x', higher: false },
    { l: 'P/B', v: r.pb, unit: 'x', higher: false },
    { l: 'ROE', v: r.roe, unit: '%', higher: true },
    { l: 'D/E', v: r.debt_to_equity, unit: 'x', higher: false },
    { l: 'Net Margin', v: r.profit_margin, unit: '%', higher: true },
    { l: 'Rev Growth', v: r.revenue_growth, unit: '%', higher: true },
    { l: 'Op Margin', v: r.op_margin, unit: '%', higher: true },
  ]

  const maxVals = { pe: 150, pb: 20, roe: 40, de: 3, netMargin: 30, revGrowth: 60, opMargin: 30 }

  const analysePeer = async () => {
    const s = peerTicker.trim().toUpperCase()
    if (!s) return
    setLoading(true)
    try {
      const d = await analyseStock(s)
      setPeerData(d)
      showToast(`${s} loaded for comparison`)
    } catch (e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }

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
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{data.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>vs Peers</span>
          </div>
          <span style={{ fontSize: 10, padding: '4px 8px', background: 'var(--accent-dim)', color: 'var(--accent-primary)', borderRadius: 6, fontWeight: 700 }}>
            {peers.length} peers
          </span>
        </div>
      </div>

      <SecHeader label="Peer Comparison" collapsed={collapsed.peers} onToggle={() => toggleSection('peers')} />
      {!collapsed.peers && (
        <div className="panel" style={{ padding: 0, marginBottom: 12, overflow: 'auto' }}>
          {peers.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  {Object.keys(peers[0]).slice(0, 6).map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'var(--accent-dim)', borderLeft: '3px solid var(--accent-primary)' }}>
                  {Object.keys(peers[0]).slice(0, 6).map(k => {
                    const isName = k.toLowerCase().includes('company') || k.toLowerCase().includes('name')
                    return (
                      <td key={k} style={{ padding: '10px 12px', fontWeight: isName ? 700 : 400, color: isName ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {isName ? `${data.symbol} (You)` : data.ratios?.[k] || '—'}
                      </td>
                    )
                  })}
                </tr>
                {peers.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {Object.values(p).slice(0, 6).map((v, j) => (
                      <td key={j} style={{ padding: '10px 12px', fontWeight: j === 0 ? 600 : 400 }}>{v || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 14, fontSize: 11, color: 'var(--text-dim)' }}>
              Peer data not available.
            </div>
          )}
        </div>
      )}

      <SecHeader label="Key Metrics" collapsed={collapsed.metrics} onToggle={() => toggleSection('metrics')} />
      {!collapsed.metrics && (
        <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
          {metrics.map(m => {
            if (!m.v) return null
            const n = parseFloat(m.v) || 0
            const maxB = maxVals[m.l.toLowerCase().replace(' ', '')] || 100
            const pct = Math.min(n / maxB * 100, 100)
            const col = m.higher ? (n > 15 ? 'var(--gain)' : n > 8 ? 'var(--warning)' : 'var(--loss)') : (n < 30 ? 'var(--gain)' : n < 60 ? 'var(--warning)' : 'var(--loss)')
            return (
              <div key={m.l} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 80, flexShrink: 0 }}>{m.l}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', width: 45, textAlign: 'right' }}>{fN(m.v, '', '' + m.unit, 1)}</span>
              </div>
            )
          })}
        </div>
      )}

      <SecHeader label="Compare" collapsed={collapsed.compare} onToggle={() => toggleSection('compare')} />
      {!collapsed.compare && (
        <div className="panel" style={{ padding: 14 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              className="input"
              style={{ flex: 1, fontSize: 11 }}
              placeholder="Enter peer NSE ticker"
              value={peerTicker}
              onChange={e => setPeerTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && analysePeer()}
            />
            <button className="btn-primary" onClick={analysePeer} disabled={loading} style={{ padding: '8px 16px', fontSize: 11, borderRadius: 8 }}>
              {loading ? '...' : 'Analyze'}
            </button>
          </div>
          {peerData && (() => {
            const pr = peerData.ratios || {}
            const rows = [
              ['P/E', r.pe, pr.pe, 'lower'],
              ['ROE %', r.roe, pr.roe, 'higher'],
              ['D/E', r.debt_to_equity, pr.debt_to_equity, 'lower'],
              ['Rev Growth %', r.revenue_growth, pr.revenue_growth, 'higher'],
              ['Net Margin %', r.profit_margin, pr.profit_margin, 'higher'],
              ['Op Margin %', r.op_margin, pr.op_margin, 'higher'],
              ['P/B', r.pb, pr.pb, 'lower'],
              ['Grade', data.fundamental?.grade, peerData.fundamental?.grade, 'n']
            ]
            return (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)' }}>
                    {['Metric', data.symbol, peerData.symbol, 'Winner'].map((h, i) => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: i > 0 && i < 3 ? 'right' : 'left', color: 'var(--text-dim)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([l, v1, v2, dir]) => {
                    const n1 = parseFloat(v1) || 0, n2 = parseFloat(v2) || 0
                    const win = dir === 'higher' ? (n1 > n2 ? data.symbol : peerData.symbol) : dir === 'lower' ? (n1 < n2 ? data.symbol : peerData.symbol) : '—'
                    const wc = win === data.symbol ? 'var(--gain)' : win === peerData.symbol ? 'var(--loss)' : 'var(--text-dim)'
                    return (
                      <tr key={l} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{l}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{v1 || '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{v2 || '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: wc }}>{win}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          })()}
        </div>
      )}
    </div>
  )
}