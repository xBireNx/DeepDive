import { useState } from 'react'

export default function Calculators() {
  const [calcType, setCalcType] = useState('sip')

  return (
    <div>
      <div className="sec">
        <span className="sec-l">Financial Calculators</span>
        <div className="sec-line" style={{ flex: 1 }} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          className={calcType === 'sip' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setCalcType('sip')}
        >
          SIP Calculator
        </button>
        <button
          className={calcType === 'tax' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setCalcType('tax')}
        >
          Tax Calculator
        </button>
      </div>

      {calcType === 'sip' && <SIPCalculator />}
      {calcType === 'tax' && <TaxCalculator />}
    </div>
  )
}

function SIPCalculator() {
  const [monthly, setMonthly] = useState(5000)
  const [years, setYears] = useState(10)
  const [rate, setRate] = useState(12)

  const n = years * 12
  const r = rate / 12 / 100
  const invested = monthly * n
  const wealth = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r))
  const returns = wealth - invested

  return (
    <div className="layout-2col">
      <div className="card">
        <div className="card-title">SIP Compounding Calculator</div>

        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>Monthly Investment (₹)</label>
            <input type="number" className="input" value={monthly} onChange={e => setMonthly(Number(e.target.value))} />
            <input
              type="range"
              min="500"
              max="100000"
              step="500"
              value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              style={{ width: '100%', marginTop: 12 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>Time Period (Years)</label>
            <input type="number" className="input" value={years} onChange={e => setYears(Number(e.target.value))} />
            <input
              type="range"
              min="1"
              max="40"
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              style={{ width: '100%', marginTop: 12 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>Expected Return (%)</label>
            <input type="number" className="input" value={rate} onChange={e => setRate(Number(e.target.value))} />
            <input
              type="range"
              min="1"
              max="30"
              value={rate}
              onChange={e => setRate(Number(e.target.value))}
              style={{ width: '100%', marginTop: 12 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Total Investment</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>₹{invested.toLocaleString('en-IN')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Est. Returns</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>₹{returns.toLocaleString('en-IN')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '28px 24px', background: 'var(--primary-glow)', border: '2px solid var(--primary)' }}>
          <div style={{ fontSize: 13, color: 'var(--primary)', marginBottom: 8, fontWeight: 600 }}>Total Wealth</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--primary)' }}>₹{wealth.toLocaleString('en-IN')}</div>
        </div>
      </div>
    </div>
  )
}

function TaxCalculator() {
  const [buyPrice, setBuyPrice] = useState(100)
  const [sellPrice, setSellPrice] = useState(150)
  const [qty, setQty] = useState(100)
  const [holdingPeriod, setHoldingPeriod] = useState('stcg')

  const profit = (sellPrice - buyPrice) * qty
  const stcgTax = profit > 0 ? profit * 0.20 : 0
  const ltcgTax = profit > 0 ? Math.max(0, profit - 125000) * 0.125 : 0
  const tax = holdingPeriod === 'stcg' ? stcgTax : ltcgTax
  const net = profit - tax

  return (
    <div className="layout-2col">
      <div className="card">
        <div className="card-title">Indian Equity Tax Calculator</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 20 }}>Latest FY rules (STCG: 20%, LTCG: 12.5% over ₹1.25L)</div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>Buy Price (₹)</label>
              <input type="number" className="input" value={buyPrice} onChange={e => setBuyPrice(Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>Sell Price (₹)</label>
              <input type="number" className="input" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>Quantity</label>
            <input type="number" className="input" value={qty} onChange={e => setQty(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>Holding Period</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className={holdingPeriod === 'stcg' ? 'btn-primary' : 'btn-outline'}
                onClick={() => setHoldingPeriod('stcg')}
                style={{ flex: 1 }}
              >
                &lt; 1 Year (STCG)
              </button>
              <button
                className={holdingPeriod === 'ltcg' ? 'btn-primary' : 'btn-outline'}
                onClick={() => setHoldingPeriod('ltcg')}
                style={{ flex: 1 }}
              >
                &gt; 1 Year (LTCG)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Gross Profit / Loss</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: profit >= 0 ? 'var(--success)' : 'var(--error)' }}>
            ₹{profit.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Est. Tax Liability</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: tax > 0 ? 'var(--error)' : 'var(--text-dim)' }}>
            ₹{Math.round(tax).toLocaleString('en-IN')}
          </div>
          {holdingPeriod === 'ltcg' && (
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 8 }}>* Exemption of ₹1.25L applies</div>
          )}
        </div>
        <div className="card" style={{
          textAlign: 'center',
          padding: '28px 24px',
          background: profit >= 0 ? 'var(--success-muted)' : 'var(--error-muted)',
          border: `2px solid ${profit >= 0 ? 'var(--success)' : 'var(--error)'}`
        }}>
          <div style={{ fontSize: 13, color: profit >= 0 ? 'var(--success)' : 'var(--error)', marginBottom: 8, fontWeight: 600 }}>Net Profit after Tax</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: profit >= 0 ? 'var(--success)' : 'var(--error)' }}>
            ₹{Math.round(net).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  )
}