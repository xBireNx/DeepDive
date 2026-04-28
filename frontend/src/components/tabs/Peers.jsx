import { useState } from 'react'
import { useStore } from '../../store'
import { fN } from '../../utils'
import { showToast } from '../Toast'

export default function Peers({ data }) {
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
    <div>
      <div className="section-header">
        <span className="section-title">{data.symbol} vs Peers</span>
        <div className="section-line" style={{ flex: 1 }} />
      </div>

      {peers.length > 0 ? (
        <div className="panel" style={{ overflowX: 'auto', marginBottom: 16, padding: 0 }}>
          <div className="panel-title" style={{ padding: '14px 16px' }}>Peer Comparison</div>
          <table className="p-table">
            <thead>
              <tr>{Object.keys(peers[0]).slice(0, 6).map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              <tr style={{ background: 'var(--accent-primary-dim)', borderLeft: '3px solid var(--accent-primary)' }}>
                {Object.keys(peers[0]).slice(0, 6).map(k => {
                  const isName = k.toLowerCase().includes('company') || k.toLowerCase().includes('name')
                  return (
                    <td key={k} style={{ fontWeight: isName ? 700 : 400, color: isName ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      {isName ? `${data.symbol} (Selected)` : data.ratios?.[k] || '—'}
                    </td>
                  )
                })}
              </tr>
              {peers.map((p, i) => (
                <tr key={i}>
                  {Object.values(p).slice(0, 6).map((v, j) => (
                    <td key={j} style={{ fontWeight: j === 0 ? 600 : 400 }}>{v || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel" style={{ marginBottom: 16, fontSize: 11, color: 'var(--text-dim)' }}>
          Peer data from Screener.in not available.
        </div>
      )}

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-title">{data.symbol} — Key Metrics</div>
        {metrics.map(m => {
          if (!m.v) return null
          const n = parseFloat(m.v) || 0
          const maxB = maxVals[m.l.toLowerCase().replace(' ', '')] || 100
          const pct = Math.min(n / maxB * 100, 100)
          const col = m.higher ? (n > 15 ? 'var(--gain)' : n > 8 ? 'var(--warning)' : 'var(--loss)') : (n < 30 ? 'var(--gain)' : n < 60 ? 'var(--warning)' : 'var(--loss)')
          return (
            <div key={m.l} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 90, flexShrink: 0 }}>{m.l}</span>
              <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-primary)', width: 45, textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fN(m.v, '', '' + m.unit, 1)}</span>
            </div>
          )
        })}
      </div>

      <div className="panel">
        <div className="panel-title">Head-to-Head Comparison</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Enter peer NSE ticker"
            value={peerTicker}
            onChange={e => setPeerTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && analysePeer()}
          />
          <button className="btn-primary" onClick={analysePeer} disabled={loading} style={{ padding: '10px 18px', fontSize: 12 }}>
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
            <table className="p-table">
              <thead>
                <tr>
                  {['Metric', data.symbol, peerData.symbol, 'Winner'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(([l, v1, v2, dir]) => {
                  const n1 = parseFloat(v1) || 0, n2 = parseFloat(v2) || 0
                  const win = dir === 'higher' ? (n1 > n2 ? data.symbol : peerData.symbol) : dir === 'lower' ? (n1 < n2 ? data.symbol : peerData.symbol) : '—'
                  const wc = win === data.symbol ? 'text-gain' : win === peerData.symbol ? 'text-loss' : 'text-muted'
                  return (
                    <tr key={l}>
                      <td style={{ color: 'var(--text-secondary)' }}>{l}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{v1 || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{v2 || '—'}</td>
                      <td className={wc} style={{ fontWeight: 700 }}>{win}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        })()}
      </div>
    </div>
  )
}