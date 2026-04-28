import { useState } from 'react'
import { useStore } from '../../store'
import { showToast } from '../Toast'

export default function Alerts() {
  const { alerts, setAlert, clearAlert, watchlist, portfolio, stockCache, backendLive } = useStore()
  const allTickers = [...new Set([...watchlist, ...portfolio.map(h => h.ticker)])]
  const [form, setForm] = useState({ ticker: '', buy: '', target: '', sl: '', email: '', phone: '' })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const doSet = async () => {
    if (!form.ticker) { showToast('Select a stock', 'error'); return }
    const b = parseFloat(form.buy) || null
    const t = parseFloat(form.target) || null
    const s = parseFloat(form.sl) || null
    if (!b && !t && !s) { showToast('Set at least one level', 'error'); return }

    setAlert(form.ticker, { buy: b, target: t, sl: s })

    if (backendLive && (form.email || form.phone)) {
      try {
        const res = await fetch('/api/alerts/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: form.ticker, email: form.email, phone: form.phone, buy: b, target: t, sl: s })
        })
        const data = await res.json()
        if (!data.ok) console.warn("Backend alert subscription failed", data.error)
      } catch (e) {
        console.warn("Backend alert fetch failed", e)
      }
    }

    showToast(`Alerts set for ${form.ticker}`)
    setForm(p => ({ ...p, buy: '', target: '', sl: '' }))
  }

  const alTickers = Object.keys(alerts)

  return (
    <div className="layout-2col">
      <div>
        <div className="section-header">
          <span className="section-title">Active Alerts</span>
          <div className="section-line" style={{ flex: 1 }} />
        </div>

        {alTickers.length === 0 && (
          <div className="empty-state" style={{ minHeight: 160 }}>
            <div className="empty-icon">◎</div>
            <div className="empty-title">No alerts set</div>
          </div>
        )}

        {alTickers.map(ticker => {
          const d = stockCache[ticker]
          const al = alerts[ticker] || {}
          const cmp = d?.price?.current || 0
          const triggered = []
          if (al.buy && cmp <= al.buy) triggered.push('Buy Zone')
          if (al.sl && cmp <= al.sl) triggered.push('SL Hit')
          if (al.target && cmp >= al.target) triggered.push('Target Hit')

          const levels = [
            al.target && { l: 'Target', v: al.target, c: 'var(--gain)' },
            cmp && { l: 'CMP', v: cmp, c: 'var(--text-primary)' },
            al.buy && { l: 'Buy Zone', v: al.buy, c: 'var(--warning)' },
            al.sl && { l: 'Stop-Loss', v: al.sl, c: 'var(--loss)' },
          ].filter(Boolean).sort((a, b) => b.v - a.v)

          return (
            <div key={ticker} className="panel" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{ticker}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{d?.company?.name?.substring(0, 20) || ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: (d?.price?.ret1m || 0) >= 0 ? 'var(--gain)' : 'var(--loss)', fontFamily: 'var(--font-mono)' }}>
                    ₹{cmp.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  {triggered.map(t => (
                    <span key={t} className="badge" style={{ fontSize: 9 }}>{t}</span>
                  ))}
                  <button className="btn-sm" onClick={() => { clearAlert(ticker); showToast(`Alerts cleared for ${ticker}`) }}>Clear</button>
                </div>
              </div>

              <div style={{ position: 'relative', paddingLeft: 80 }}>
                {levels.map((lvl, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', height: 28, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, fontSize: 10, color: 'var(--text-dim)', width: 60, textAlign: 'right' }}>{lvl.l}</span>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        border: `2px solid ${lvl.c}`,
                        position: 'absolute',
                        left: 68,
                        background: lvl.v === cmp ? 'transparent' : lvl.c,
                        boxShadow: lvl.v === cmp ? `0 0 6px ${lvl.c}` : 'none'
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 700, color: lvl.c, marginLeft: 88, fontFamily: 'var(--font-mono)' }}>₹{lvl.v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="panel" style={{ padding: '16px' }}>
          <div className="panel-title">Set Price Alert</div>
          <select className="select" style={{ marginBottom: 8 }} value={form.ticker} onChange={e => f('ticker', e.target.value)}>
            <option value="">Select Stock</option>
            {allTickers.map(t => (
              <option key={t} value={t}>
                {t}{stockCache[t] ? ` — ₹${stockCache[t].price?.current?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : ''}
              </option>
            ))}
          </select>
          <input className="input" style={{ marginBottom: 8 }} type="number" placeholder="Buy Zone / Entry ₹" value={form.buy} onChange={e => f('buy', e.target.value)} />
          <input className="input" style={{ marginBottom: 8 }} type="number" placeholder="Target Price ₹" value={form.target} onChange={e => f('target', e.target.value)} />
          <input className="input" style={{ marginBottom: 10 }} type="number" placeholder="Stop-Loss ₹" value={form.sl} onChange={e => f('sl', e.target.value)} />

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 8 }}>Optional: Notify me via Email/SMS</div>
            <input className="input" style={{ marginBottom: 8 }} type="email" placeholder="Email Address" value={form.email} onChange={e => f('email', e.target.value)} />
            <input className="input" style={{ marginBottom: 8 }} type="tel" placeholder="Phone Number" value={form.phone} onChange={e => f('phone', e.target.value)} />
          </div>

          <button className="btn-primary" style={{ width: '100%' }} onClick={doSet}>Set Alert</button>
        </div>

        <div className="panel" style={{ padding: '14px' }}>
          <div className="panel-title">Guide</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: 'var(--warning)', fontSize: 9 }}>●</span>
              <span><strong>Buy Zone</strong> — Entry with margin of safety</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: 'var(--gain)', fontSize: 9 }}>●</span>
              <span><strong>Target</strong> — Intrinsic value estimate</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ color: 'var(--loss)', fontSize: 9 }}>●</span>
              <span><strong>Stop-Loss</strong> — Thesis broken. Exit.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}