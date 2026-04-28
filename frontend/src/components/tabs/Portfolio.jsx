import { useState } from 'react'
import { useStore } from '../../store'
import { fN, gradeColor } from '../../utils'
import { SectorPie, GradeBar } from '../charts'
import { showToast } from '../Toast'

export default function Portfolio() {
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
    <div>
      <div className="g4" style={{ marginBottom: 16 }}>
        {[
          ['Invested', `₹${totalInv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, ''],
          ['Current', `₹${totalCurr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, pnl >= 0 ? 'g' : 'r'],
          ['Total P&L', `${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, pnl >= 0 ? 'g' : 'r'],
          ['Overall Return', `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, pct >= 0 ? 'g' : 'r']
        ].map(([l, v, c]) => (
          <div key={l} className="stat-card">
            <div className="stat-label">{l}</div>
            <div className={`stat-value ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="layout-2col">
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 80px 90px 100px auto', gap: 10, padding: '14px 16px', background: 'var(--surface-elevated)', borderBottom: '1px solid var(--border)' }}>
              {[
                ['ticker', 'Ticker (e.g. KRN)'],
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
                />
              ))}
              <button className="btn-primary" onClick={doAdd} style={{ padding: '10px 16px' }}>+ Add</button>
            </div>

            <table className="p-table">
              <thead>
                <tr>
                  {['Stock', 'Qty', 'Buy', 'CMP', 'P&L', 'Return', 'Weight', 'Grade', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32, fontSize: 13 }}>
                      No holdings. Add your first position above.
                    </td>
                  </tr>
                )}
                {portfolio.map((h, i) => {
                  const d = stockCache[h.ticker]
                  const cmp = d?.price?.current || null
                  const curr = cmp ? h.qty * cmp : null
                  const inv = h.qty * h.buyPrice
                  const rowPnl = curr ? curr - inv : null
                  const rowPct = curr && inv ? rowPnl / inv * 100 : null
                  const wt = totalCurr && curr ? (curr / totalCurr * 100).toFixed(1) : '—'
                  const rc = rowPnl >= 0 ? 'cg' : 'cr'
                  return (
                    <tr key={i}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{h.ticker}</span>
                        {!d && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 6 }}>(not analyzed)</span>}
                      </td>
                      <td>{h.qty}</td>
                      <td>₹{h.buyPrice.toLocaleString('en-IN')}</td>
                      <td>{cmp ? `₹${cmp.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}</td>
                      <td className={rowPnl !== null ? rc : 'cd'}>
                        {rowPnl !== null ? `${rowPnl >= 0 ? '+' : ''}₹${Math.abs(rowPnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                      </td>
                      <td className={rowPct !== null ? rc : 'cd'}>
                        {rowPct !== null ? `${rowPct >= 0 ? '+' : ''}${rowPct.toFixed(1)}%` : '—'}
                      </td>
                      <td>{wt}%</td>
                      <td>
                        <span style={{ color: gradeColor(d?.fundamental?.grade), fontWeight: 700 }}>
                          {d?.fundamental?.grade || '?'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-sm-red" onClick={() => { removeHolding(i); showToast(`${h.ticker} removed`) }}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sidebar-panel">
          <div className="chart-card">
            <div className="chart-title">Sector Exposure</div>
            <div style={{ height: 200 }}><SectorPie data={sectorMap} /></div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Grade Mix</div>
            <div style={{ height: 200 }}><GradeBar data={gradeMap} /></div>
          </div>
          <div className="card">
            <div className="card-title">Concentration Risk</div>
            {portfolio.length ? portfolio.map(h => {
              const d = stockCache[h.ticker]
              const w = totalCurr && d?.price?.current ? (h.qty * d.price.current / totalCurr * 100).toFixed(1) : 0
              return (
                <div key={h.ticker} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 60 }}>{h.ticker}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--surface-hover)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${w}%`, background: w > 25 ? 'var(--error)' : w > 15 ? 'var(--warning)' : 'var(--success)', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text)', width: 36, textAlign: 'right', fontWeight: 600 }}>{w}%</span>
                </div>
              )
            }) : <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Add holdings to see risk</div>}
          </div>
        </div>
      </div>
    </div>
  )
}