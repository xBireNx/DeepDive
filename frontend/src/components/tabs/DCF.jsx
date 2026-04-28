import { useState } from 'react'

function Slider({ id, label, value, min, max, step = 0.5, unit, desc, onChange }) {
  return (
    <div className="dcf-slider">
      <div className="dcf-slider-label">
        <span>{label}</span>
        <span className="dcf-slider-value">{value}<span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 4 }}>{unit}</span></span>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <div className="dcf-slider-range">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
      {desc && <div className="dcf-slider-desc">{desc}</div>}
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
  const r = data?.ratios || {}
  const dRG1 = Math.min(Math.max(r.revenue_growth || 15, 5), 60)
  const [params, setParams] = useState({ rg1: dRG1, rg2: Math.max(dRG1 - 10, 3), marg: r.profit_margin || 8, disc: 12, termG: 4, yrs: 10, mos: 30 })

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">⊛</div>
      <div className="empty-text">Select a stock first</div>
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
    <div className="layout-2col">
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{data.symbol} — DCF Valuation</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Adjust assumptions → see intrinsic value</div>
        </div>

        {[
          ['rg1', 'Revenue Growth Yr 1–5', params.rg1, '%', 'Expected annual revenue growth years 1–5. Be conservative.', 2, 80],
          ['rg2', 'Revenue Growth Yr 6–10', params.rg2, '%', 'Growth decelerates. Use GDP+premium for stable businesses.', 1, 50],
          ['marg', 'Net Profit Margin', params.marg, '%', 'Sustainable net margin. Use trailing average, not peak.', 1, 40],
          ['disc', 'Discount Rate (WACC)', params.disc, '%', 'Your required return. 12–15% for Indian small/mid caps.', 8, 20],
          ['termG', 'Terminal Growth Rate', params.termG, '%', 'Long-term GDP-like growth. Must be < discount rate.', 1, 7],
          ['yrs', 'Projection Years', params.yrs, ' yrs', 'Years of above-average growth projected.', 5, 15, 1],
          ['mos', 'Margin of Safety', params.mos, '%', 'Buffett buys at 25–50% discount to intrinsic value.', 10, 60],
        ].map(([id, lbl, val, unit, desc, mn, mx, stp]) => (
          <Slider key={id} id={id} label={lbl} value={val} min={mn} max={mx} step={stp || 0.5} unit={unit} desc={desc} onChange={v => set(id, v)} />
        ))}
      </div>

      <div style={{ position: 'sticky', top: 0 }}>
        <div className="dcf-result" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Intrinsic Value</div>
          <div className="dcf-iv">
            ₹{Math.round(iv).toLocaleString('en-IN')}<sup>/sh</sup>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>Current: ₹{cmp.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>Margin of Safety</div>
            <div className="dcf-mos" style={{ color: mosPct >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {mosPct >= 0 ? '+' : ''}{mosPct.toFixed(1)}%
            </div>
          </div>

          <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 10, background: isUnder ? 'var(--success-muted)' : 'var(--error-muted)', border: `1px solid ${isUnder ? 'var(--success)' : 'var(--error)'}`, color: isUnder ? 'var(--success)' : 'var(--error)', fontSize: 12, textAlign: 'left', lineHeight: 1.6 }}>
            {isUnder
              ? `✓ Below intrinsic value. Buy below ₹${Math.round(buyAt).toLocaleString('en-IN')} for ${params.mos}% MOS.`
              : `⚠ Above intrinsic value. Wait for ₹${Math.round(buyAt).toLocaleString('en-IN')} or lower.`
            }
          </div>

          <div className="dcf-scenario">
            <div className="dcf-scenario-card bear">
              <div style={{ fontSize: 10, color: 'var(--error)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Bear</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--error)' }}>₹{Math.round(bear.iv).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                {((bear.iv - cmp) / bear.iv * 100) >= 0 ? '+' : ''}{((bear.iv - cmp) / bear.iv * 100).toFixed(0)}% MOS
              </div>
            </div>
            <div className="dcf-scenario-card" style={{ borderColor: 'var(--warning)' }}>
              <div style={{ fontSize: 10, color: 'var(--warning)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Base</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>₹{Math.round(iv).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                {mosPct >= 0 ? '+' : ''}{mosPct.toFixed(0)}% MOS
              </div>
            </div>
            <div className="dcf-scenario-card bull">
              <div style={{ fontSize: 10, color: 'var(--success)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Bull</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>₹{Math.round(bull.iv).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                {((bull.iv - cmp) / bull.iv * 100) >= 0 ? '+' : ''}{((bull.iv - cmp) / bull.iv * 100).toFixed(0)}% MOS
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div className="card-title">Value Decomposition</div>
          {[
            ['FCF PV', pvFCFps, 'var(--primary)'],
            ['Terminal PV', pvTps, 'var(--info)']
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 80, flexShrink: 0 }}>{l}</span>
              <div style={{ flex: 1, height: 8, background: 'var(--surface-hover)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(v / total * 100, 100).toFixed(0)}%`, background: c, borderRadius: 4, transition: 'width 0.6s' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text)', width: 60, textAlign: 'right', fontWeight: 600 }}>₹{Math.round(v).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}