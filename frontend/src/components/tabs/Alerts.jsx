import { useState } from 'react'
import { useStore, API } from '../../store'
import { showToast } from '../Toast'

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function Alerts() {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

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
        const res = await fetch(`${API}/alerts/subscribe`, {
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
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Alerts</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>{alTickers.length} active</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          <SecHeader label="Active Alerts" collapsed={collapsed.active} onToggle={() => toggleSection('active')} />
          {!collapsed.active && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alTickers.length === 0 && (
                <div className="empty-state" style={{ minHeight: 100 }}>
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
                  <div key={ticker} className="panel" style={{ padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{ticker}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{d?.company?.name?.substring(0, 20) || ''}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: (d?.price?.ret1m || 0) >= 0 ? 'var(--gain)' : 'var(--loss)', fontFamily: 'var(--font-mono)' }}>
                          ₹{cmp.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        {triggered.map(t => (
                          <span key={t} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'var(--accent-dim)', color: 'var(--accent-primary)', fontWeight: 600 }}>{t}</span>
                        ))}
                        <button onClick={() => { clearAlert(ticker); showToast(`Alerts cleared for ${ticker}`) }} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>Clear</button>
                      </div>
                    </div>

                    <div style={{ position: 'relative', paddingLeft: 70 }}>
                      {levels.map((lvl, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', height: 24, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0, fontSize: 9, color: 'var(--text-dim)', width: 50, textAlign: 'right' }}>{lvl.l}</span>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              border: `2px solid ${lvl.c}`,
                              position: 'absolute',
                              left: 56,
                              background: lvl.v === cmp ? 'transparent' : lvl.c,
                            }}
                          />
                          <span style={{ fontSize: 11, fontWeight: 700, color: lvl.c, marginLeft: 72, fontFamily: 'var(--font-mono)' }}>₹{lvl.v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SecHeader label="Set Alert" collapsed={collapsed.set} onToggle={() => toggleSection('set')} />
          {!collapsed.set && (
            <div className="panel" style={{ padding: 14 }}>
              <select className="select" style={{ marginBottom: 8, fontSize: 11 }} value={form.ticker} onChange={e => f('ticker', e.target.value)}>
                <option value="">Select Stock</option>
                {allTickers.map(t => (
                  <option key={t} value={t}>
                    {t}{stockCache[t] ? ` — ₹${stockCache[t].price?.current?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : ''}
                  </option>
                ))}
              </select>
              <input className="input" style={{ marginBottom: 8, fontSize: 11 }} type="number" placeholder="Buy Zone / Entry ₹" value={form.buy} onChange={e => f('buy', e.target.value)} />
              <input className="input" style={{ marginBottom: 8, fontSize: 11 }} type="number" placeholder="Target Price ₹" value={form.target} onChange={e => f('target', e.target.value)} />
              <input className="input" style={{ marginBottom: 10, fontSize: 11 }} type="number" placeholder="Stop-Loss ₹" value={form.sl} onChange={e => f('sl', e.target.value)} />

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 6 }}>Optional: Notify me</div>
                <input className="input" style={{ marginBottom: 6, fontSize: 10 }} type="email" placeholder="Email" value={form.email} onChange={e => f('email', e.target.value)} />
                <input className="input" style={{ marginBottom: 8, fontSize: 10 }} type="tel" placeholder="Phone" value={form.phone} onChange={e => f('phone', e.target.value)} />
              </div>

              <button className="btn-primary" style={{ width: '100%', borderRadius: 8 }} onClick={doSet}>Set Alert</button>
            </div>
          )}

          <SecHeader label="Guide" collapsed={collapsed.guide} onToggle={() => toggleSection('guide')} />
          {!collapsed.guide && (
            <div className="panel" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: 'var(--warning)', fontSize: 8 }}>●</span>
                  <span><strong>Buy Zone</strong> — Entry with margin of safety</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: 'var(--gain)', fontSize: 8 }}>●</span>
                  <span><strong>Target</strong> — Intrinsic value estimate</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: 'var(--loss)', fontSize: 8 }}>●</span>
                  <span><strong>Stop-Loss</strong> — Thesis broken. Exit.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}