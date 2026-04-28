import { useState } from 'react'
import { useStore } from '../../store'
import { fN, gradeColor } from '../../utils'
import { SectorPie, GradeBar } from '../charts'
import { showToast } from '../Toast'

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function Portfolio() {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  const { portfolio, addHolding, removeHolding, stockCache } = useStore()
  const [form, setForm] = useState({ ticker: '', qty: '', buyPrice: '', date: new Date().toISOString().split('T')[0] })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  let totalInv = 0, totalCurr = 0, sectorMap = {}, gradeMap = { A: 0, B: 0, C: 0, D: 0 }
  portfolio.forEach(h => {
    const d = stockCache[h.ticker]
    const curr = h.qty * (d?.price?.current || h.buyPrice), inv = h.qty * h.buyPrice
    totalInv += inv; totalCurr += curr
    const sec = d?.company?.sector || h.ticker
    sectorMap[sec] = (sectorMap[sec] || 0) + curr
    const g = d?.fundamental?.grade?.[0] || 'D'
    gradeMap[g] = (gradeMap[g] || 0) + 1
  })
  const pnl = totalCurr - totalInv, pct = totalInv > 0 ? pnl / totalInv * 100 : 0

  const doAdd = () => {
    const t = form.ticker.trim().toUpperCase()
    const q = parseInt(form.qty)
    const bp = parseFloat(form.buyPrice)
    if (!t || !q || !bp) { showToast('Fill all fields', 'error'); return }
    addHolding({ ticker: t, qty: q, buyPrice: bp, date: form.date })
    setForm({ ticker: '', qty: '', buyPrice: '', date: new Date().toISOString().split('T')[0] })
    showToast(`${t} × ${q} added`)
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
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Portfolio</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>{portfolio.length} holdings</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 11, padding: '6px 12px', background: pnl >= 0 ? 'var(--gain-dim)' : 'var(--loss-dim)', color: pnl >= 0 ? 'var(--gain)' : 'var(--loss)', borderRadius: 8, fontWeight: 700 }}>
              {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          ['Invested', `₹${totalInv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'var(--text-tertiary)'],
          ['Current', `₹${totalCurr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, pnl >= 0 ? 'var(--gain)' : 'var(--loss)'],
          ['P&L', `${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, pnl >= 0 ? 'var(--gain)' : 'var(--loss)'],
          ['Return', `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, pct >= 0 ? 'var(--gain)' : 'var(--loss)']
        ].map(([l, v, c]) => (
          <div key={l} className="panel" style={{ padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: c, fontFamily: 'var(--font-mono)' }}>{v}</div>
          </div>
        ))}
      </div>

      <SecHeader label="Holdings" collapsed={collapsed.holdings} onToggle={() => toggleSection('holdings')} />
      {!collapsed.holdings && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 100px auto', gap: 8, padding: '12px 14px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
            {[
              ['ticker', 'Ticker'],
              ['qty', 'Qty'],
              ['buyPrice', 'Buy ₹'],
              ['date', 'Date']
            ].map(([k, p]) => (
              <input
                key={k}
                className="input"
                placeholder={p}
                value={form[k]}
                type={k === 'qty' || k === 'buyPrice' ? 'number' : k === 'date' ? 'date' : 'text'}
                onChange={e => f(k, k === 'ticker' ? e.target.value.toUpperCase() : e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doAdd()}
                style={{ fontSize: 11 }}
              />
            ))}
            <button className="btn-primary" onClick={doAdd} style={{ padding: '8px 12px', fontSize: 11, borderRadius: 8 }}>+ Add</button>
          </div>

          {portfolio.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 28, fontSize: 12 }}>
              No holdings. Add your first position above.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  {['Stock', 'Qty', 'Buy', 'CMP', 'P&L', 'Return', 'Wt%', 'Grade', ''].map((h, i) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: i > 0 && i < 8 ? 'right' : 'left', color: 'var(--text-dim)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.map((h, i) => {
                  const d = stockCache[h.ticker]
                  const cmp = d?.price?.current || null
                  const curr = cmp ? h.qty * cmp : null
                  const inv = h.qty * h.buyPrice
                  const rowPnl = curr ? curr - inv : null
                  const rowPct = curr && inv ? rowPnl / inv * 100 : null
                  const wt = totalCurr && curr ? (curr / totalCurr * 100).toFixed(1) : '—'
                  const rc = rowPnl >= 0 ? 'var(--gain)' : 'var(--loss)'
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{h.ticker}</span>
                        {!d && <span style={{ fontSize: 9, color: 'var(--text-dim)', marginLeft: 6 }}>(not analyzed)</span>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', padding: '10px' }}>{h.qty}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', padding: '10px' }}>₹{h.buyPrice.toLocaleString('en-IN')}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', padding: '10px' }}>{cmp ? `₹${cmp.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', padding: '10px', color: rowPnl !== null ? rc : 'inherit' }}>
                        {rowPnl !== null ? `${rowPnl >= 0 ? '+' : ''}₹${Math.abs(rowPnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', padding: '10px', color: rowPct !== null ? rc : 'inherit' }}>
                        {rowPct !== null ? `${rowPct >= 0 ? '+' : ''}${rowPct.toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', padding: '10px' }}>{wt}%</td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>
                        <span style={{ color: gradeColor(d?.fundamental?.grade), fontWeight: 700, fontSize: 11 }}>
                          {d?.fundamental?.grade || '?'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>
                        <button onClick={() => { removeHolding(i); showToast(`${h.ticker} removed`) }} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <SecHeader label="Sector Exposure" collapsed={collapsed.sector} onToggle={() => toggleSection('sector')} />
        <SecHeader label="Grade Mix" collapsed={collapsed.grade} onToggle={() => toggleSection('grade')} />
        <SecHeader label="Risk" collapsed={collapsed.risk} onToggle={() => toggleSection('risk')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {!collapsed.sector && (
          <div className="chart-panel">
            <div className="chart-title">Sectors</div>
            <div style={{ height: 160 }}><SectorPie data={sectorMap} /></div>
          </div>
        )}
        {!collapsed.grade && (
          <div className="chart-panel">
            <div className="chart-title">Grades</div>
            <div style={{ height: 160 }}><GradeBar data={gradeMap} /></div>
          </div>
        )}
        {!collapsed.risk && (
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 10 }}>Concentration</div>
            {portfolio.length ? portfolio.map(h => {
              const d = stockCache[h.ticker]
              const w = totalCurr && d?.price?.current ? (h.qty * d.price.current / totalCurr * 100).toFixed(1) : 0
              return (
                <div key={h.ticker} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 45 }}>{h.ticker}</span>
                  <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${w}%`, background: w > 25 ? 'var(--loss)' : w > 15 ? 'var(--warning)' : 'var(--gain)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', width: 30, textAlign: 'right' }}>{w}%</span>
                </div>
              )
            }) : <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Add holdings</div>}
          </div>
        )}
      </div>
    </div>
  )
}