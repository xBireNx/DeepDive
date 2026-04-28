import { useState } from 'react'

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

function Slider({ id, label, value, min, max, step = 0.5, unit, desc, onChange }) {
  return (
    <div className="panel" style={{ padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
          {value}<span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 4 }}>{unit}</span>
        </span>
      </div>
      <input
        type="range"
        style={{ width: '100%', accentColor: 'var(--accent-primary)', height: 4, cursor: 'pointer' }}
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
      {desc && <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>{desc}</div>}
    </div>
  )
}

function calcDCF(d, { rg1, rg2, marg, disc, termG, yrs }) {
  const baseRevCr = d.ratios?.ps ? (d.company?.market_cap_cr || 100) / d.ratios.ps : (d.company?.market_cap_cr || 100) / 5
  let rev = baseRevCr, pvFCF = 0, flows = []
  for (let i = 1; i <= yrs; i++) {
    rev = rev * (1 + (i <= 5 ? rg1 : rg2) / 100)
    const fcf = rev * (marg / 100) * 0.7
    const pv = fcf / Math.pow(1 + disc / 100, i)
    pvFCF += pv; flows.push({ yr: i, fcf, pv })
  }
  const tFCF = flows[flows.length - 1].fcf * (1 + termG / 100)
  const tV = tFCF / (disc / 100 - termG / 100)
  const pvT = tV / Math.pow(1 + disc / 100, yrs)
  const totalCr = pvFCF + pvT
  const shares = (d.company?.market_cap_cr || 1) * 1e7 / (d.price?.current || 1)
  const iv = totalCr * 1e7 / shares
  return { iv, pvFCFps: pvFCF * 1e7 / shares, pvTps: pvT * 1e7 / shares }
}

export default function DCF({ data }) {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  const r = data?.ratios || {}
  const dRG1 = Math.min(Math.max(r.revenue_growth || 15, 5), 60)
  const [params, setParams] = useState({ rg1: dRG1, rg2: Math.max(dRG1 - 10, 3), marg: r.profit_margin || 8, disc: 12, termG: 4, yrs: 10, mos: 30 })

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">⊛</div>
      <div className="empty-title">Select a stock first</div>
    </div>
  )

  const set = (k, v) => setParams(p => ({ ...p, [k]: v }))
  const res = calcDCF(data, params)
  const { iv, pvFCFps, pvTps } = res
  const cmp = data.price?.current || 0
  const buyAt = iv * (1 - params.mos / 100)
  const mosPct = ((iv - cmp) / iv * 100)
  const isUnder = cmp <= buyAt
  const bear = calcDCF(data, { ...params, rg1: Math.max(params.rg1 - 10, 2), rg2: Math.max(params.rg2 - 5, 1), marg: params.marg - 3, disc: params.disc + 2, termG: params.termG - 1 })
  const bull = calcDCF(data, { ...params, rg1: params.rg1 + 10, rg2: params.rg2 + 5, marg: params.marg + 3, disc: params.disc - 1, termG: params.termG + 1 })
  const total = pvFCFps + pvTps || 1

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
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>DCF Valuation</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 10, padding: '4px 8px', background: 'var(--accent-dim)', color: 'var(--accent-primary)', borderRadius: 6, fontWeight: 700 }}>
              Base: ₹{Math.round(iv).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <SecHeader label="Assumptions" collapsed={collapsed.params} onToggle={() => toggleSection('params')} />
          {!collapsed.params && (
            <>
              {[
                ['rg1', 'Revenue Growth Yr 1–5', params.rg1, '%', 'Expected annual revenue growth years 1–5.', 2, 80],
                ['rg2', 'Revenue Growth Yr 6–10', params.rg2, '%', 'Growth decelerates after year 5.', 1, 50],
                ['marg', 'Net Profit Margin', params.marg, '%', 'Sustainable net margin.', 1, 40],
                ['disc', 'Discount Rate (WACC)', params.disc, '%', 'Required return (12-15% for small caps).', 8, 20],
                ['termG', 'Terminal Growth Rate', params.termG, '%', 'Long-term growth (must be < discount).', 1, 7],
                ['yrs', 'Projection Years', params.yrs, ' yrs', 'Years of above-average growth.', 5, 15, 1],
                ['mos', 'Margin of Safety', params.mos, '%', 'Discount to intrinsic value.', 10, 60],
              ].map(([id, lbl, val, unit, desc, mn, mx, stp]) => (
                <Slider key={id} id={id} label={lbl} value={val} min={mn} max={mx} step={stp || 0.5} unit={unit} desc={desc} onChange={v => set(id, v)} />
              ))}
            </>
          )}
        </div>

        <div>
          <SecHeader label="Valuation" collapsed={collapsed.val} onToggle={() => toggleSection('val')} />
          {!collapsed.val && (
            <div className="panel" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Intrinsic Value</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                ₹{Math.round(iv).toLocaleString('en-IN')}<span style={{ fontSize: 14, color: 'var(--text-dim)' }}>/sh</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>Current: ₹{cmp.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Margin of Safety</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: mosPct >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                  {mosPct >= 0 ? '+' : ''}{mosPct.toFixed(1)}%
                </div>
              </div>

              <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: isUnder ? 'var(--gain-dim)' : 'var(--loss-dim)', border: `1px solid ${isUnder ? 'var(--gain)' : 'var(--loss)'}`, color: isUnder ? 'var(--gain)' : 'var(--loss)', fontSize: 11, lineHeight: 1.5 }}>
                {isUnder
                  ? `✓ Below intrinsic. Buy below ₹${Math.round(buyAt).toLocaleString('en-IN')} for ${params.mos}% MOS.`
                  : `⚠ Above intrinsic. Wait for ₹${Math.round(buyAt).toLocaleString('en-IN')} or lower.`
                }
              </div>
            </div>
          )}

          <SecHeader label="Scenarios" collapsed={collapsed.scen} onToggle={() => toggleSection('scen')} />
          {!collapsed.scen && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div className="panel" style={{ padding: 10, textAlign: 'center', border: '1px solid var(--loss)' }}>
                <div style={{ fontSize: 9, color: 'var(--loss)', textTransform: 'uppercase', marginBottom: 4 }}>Bear</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--loss)', fontFamily: 'var(--font-mono)' }}>₹{Math.round(bear.iv).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>
                  {((bear.iv - cmp) / bear.iv * 100) >= 0 ? '+' : ''}{((bear.iv - cmp) / bear.iv * 100).toFixed(0)}%
                </div>
              </div>
              <div className="panel" style={{ padding: 10, textAlign: 'center', border: '1px solid var(--accent-primary)' }}>
                <div style={{ fontSize: 9, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 4 }}>Base</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>₹{Math.round(iv).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>
                  {mosPct >= 0 ? '+' : ''}{mosPct.toFixed(0)}%
                </div>
              </div>
              <div className="panel" style={{ padding: 10, textAlign: 'center', border: '1px solid var(--gain)' }}>
                <div style={{ fontSize: 9, color: 'var(--gain)', textTransform: 'uppercase', marginBottom: 4 }}>Bull</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gain)', fontFamily: 'var(--font-mono)' }}>₹{Math.round(bull.iv).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>
                  {((bull.iv - cmp) / bull.iv * 100) >= 0 ? '+' : ''}{((bull.iv - cmp) / bull.iv * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}

          <SecHeader label="Decomposition" collapsed={collapsed.decomp} onToggle={() => toggleSection('decomp')} />
          {!collapsed.decomp && (
            <div className="panel" style={{ padding: 14 }}>
              {[
                ['FCF PV', pvFCFps, 'var(--accent-primary)'],
                ['Terminal PV', pvTps, 'var(--accent-secondary)']
              ].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 60, flexShrink: 0 }}>{l}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(v / total * 100, 100).toFixed(0)}%`, background: c, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{Math.round(v).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}