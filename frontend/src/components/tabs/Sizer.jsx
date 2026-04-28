import { useState } from 'react'

function calcPosition(pf, cmp, sl, riskPct, winRate, rr) {
  if (!pf || !cmp || !sl || cmp <= sl) return null
  const maxRisk = pf * (riskPct / 100)
  const perShare = cmp - sl
  const ffShares = Math.floor(maxRisk / perShare)
  const lossRate = 1 - winRate / 100
  const fullKelly = (winRate / 100 * rr - lossRate) / rr
  const halfKelly = Math.max(fullKelly / 2, 0)
  const kShares = Math.floor(pf * halfKelly / cmp)
  const rec = Math.min(ffShares, kShares)
  const amount = rec * cmp
  return { rec, amount, ffShares, kShares, fullKelly, halfKelly, maxRisk, perShare, weight: pf > 0 ? amount / pf * 100 : 0 }
}

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function Sizer({ data }) {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  const cmp = data?.price?.current || 0
  const [pf, setPf] = useState(1000000)
  const [price, setPrice] = useState(cmp)
  const [sl, setSl] = useState(0)
  const [risk, setRisk] = useState(2)
  const [win, setWin] = useState(60)
  const [rr, setRr] = useState(2)

  const res = calcPosition(pf, price || cmp, sl, risk, win, rr)

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
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Position Sizer</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>{data?.symbol || ''}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <SecHeader label="Inputs" collapsed={collapsed.inputs} onToggle={() => toggleSection('inputs')} />
          {!collapsed.inputs && (
            <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Portfolio (₹)', pf, setPf],
                  ['Price (₹)', price || cmp, setPrice],
                  ['Stop-Loss (₹)', sl, setSl],
                  ['Risk %', risk, setRisk],
                  ['Win Rate %', win, setWin],
                  ['R:R Ratio', rr, setRr],
                ].map(([l, v, s], i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
                    <input className="input" type="number" value={v} onChange={e => s(parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <SecHeader label="Kelly Criterion" collapsed={collapsed.kelly} onToggle={() => toggleSection('kelly')} />
          {!collapsed.kelly && (
            <div className="panel" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div><strong>Full Kelly</strong> = (Win Rate × RR − Loss Rate) / RR</div>
                <div><strong>Half Kelly</strong> = Full Kelly / 2 (recommended)</div>
                <div><strong>Fixed Fractional</strong> = Max Risk ÷ Per-Share Risk</div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 8, fontSize: 10, color: 'var(--text-dim)' }}>
                  {'Use smaller of the two. Never risk > 2% per trade.'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          {res ? (
            <>
              <div className="panel" style={{ textAlign: 'center', padding: 20, marginBottom: 12, border: '2px solid var(--gain)', background: 'var(--gain-dim)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 800, color: 'var(--gain)' }}>{res.rec.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Recommended Shares</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 12 }}>₹{res.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{res.weight.toFixed(1)}% of portfolio</div>
              </div>
              <div className="panel" style={{ padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 10 }}>Breakdown</div>
                {[
                  ['Max Risk', `₹${res.maxRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
                  ['Per-share risk', `₹${res.perShare.toFixed(1)}`],
                  ['Fixed Frac shares', res.ffShares.toLocaleString()],
                  ['Full Kelly %', `${(res.fullKelly * 100).toFixed(1)}%`],
                  ['Half Kelly shares', res.kShares.toLocaleString()],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="panel" style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 11 }}>
              Enter portfolio, price, and stop-loss.<br />SL must be below current price.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}