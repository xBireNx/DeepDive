import { useState } from 'react'

export default function Calculators() {
  const [calcType, setCalcType] = useState('sip')

  return (
    <div className="tab-pane fade-in">
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button 
          className={`btn-${calcType === 'sip' ? 'primary' : 'outline'}`} 
          onClick={() => setCalcType('sip')}
        >
          SIP Calculator
        </button>
        <button 
          className={`btn-${calcType === 'tax' ? 'primary' : 'outline'}`} 
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
  // Future Value of SIP = P * [(1+r)^n - 1] / r * (1+r)
  const wealth = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r))
  const returns = wealth - invested

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">SIP Compounding Calculator</h3>
      </div>
      <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 30 }}>
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <label style={{display:'block', marginBottom:5, fontSize:12, color:'var(--muted)'}}>Monthly Investment (₹)</label>
            <input type="number" className="input" value={monthly} onChange={e=>setMonthly(Number(e.target.value))} />
            <input type="range" min="500" max="100000" step="500" value={monthly} onChange={e=>setMonthly(Number(e.target.value))} style={{width:'100%', marginTop:10}} />
          </div>
          <div>
            <label style={{display:'block', marginBottom:5, fontSize:12, color:'var(--muted)'}}>Time Period (Years)</label>
            <input type="number" className="input" value={years} onChange={e=>setYears(Number(e.target.value))} />
            <input type="range" min="1" max="40" value={years} onChange={e=>setYears(Number(e.target.value))} style={{width:'100%', marginTop:10}} />
          </div>
          <div>
            <label style={{display:'block', marginBottom:5, fontSize:12, color:'var(--muted)'}}>Expected Return (%)</label>
            <input type="number" className="input" value={rate} onChange={e=>setRate(Number(e.target.value))} />
            <input type="range" min="1" max="30" value={rate} onChange={e=>setRate(Number(e.target.value))} style={{width:'100%', marginTop:10}} />
          </div>
        </div>

        <div style={{ flex: '1 1 300px', background: 'var(--bg-lighter)', padding: 20, borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: 15 }}>
            <div style={{fontSize: 12, color: 'var(--muted)'}}>Total Investment</div>
            <div style={{fontSize: 24, fontWeight: 600}}>₹{invested.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ marginBottom: 15 }}>
            <div style={{fontSize: 12, color: 'var(--muted)'}}>Est. Returns</div>
            <div style={{fontSize: 24, fontWeight: 600, color: 'var(--up)'}}>₹{returns.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ padding: 15, background: 'rgba(56, 189, 248, 0.1)', borderRadius: 6, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div style={{fontSize: 12, color: 'var(--brand)'}}>Total Wealth</div>
            <div style={{fontSize: 32, fontWeight: 700, color: 'var(--brand)'}}>₹{wealth.toLocaleString('en-IN')}</div>
          </div>
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
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Indian Equity Tax Calculator</h3>
        <span style={{fontSize: 12, color: 'var(--muted)'}}>Latest FY rules (STCG: 20%, LTCG: 12.5% over ₹1.25L)</span>
      </div>
      <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 30 }}>
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{display:'block', marginBottom:5, fontSize:12, color:'var(--muted)'}}>Buy Price (₹)</label>
              <input type="number" className="input" value={buyPrice} onChange={e=>setBuyPrice(Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{display:'block', marginBottom:5, fontSize:12, color:'var(--muted)'}}>Sell Price (₹)</label>
              <input type="number" className="input" value={sellPrice} onChange={e=>setSellPrice(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label style={{display:'block', marginBottom:5, fontSize:12, color:'var(--muted)'}}>Quantity</label>
            <input type="number" className="input" value={qty} onChange={e=>setQty(Number(e.target.value))} />
          </div>
          <div>
            <label style={{display:'block', marginBottom:5, fontSize:12, color:'var(--muted)'}}>Holding Period</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className={`btn-${holdingPeriod === 'stcg' ? 'primary' : 'outline'}`} 
                onClick={() => setHoldingPeriod('stcg')}
                style={{ flex: 1 }}
              >
                &lt; 1 Year (STCG)
              </button>
              <button 
                className={`btn-${holdingPeriod === 'ltcg' ? 'primary' : 'outline'}`} 
                onClick={() => setHoldingPeriod('ltcg')}
                style={{ flex: 1 }}
              >
                &gt; 1 Year (LTCG)
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 300px', background: 'var(--bg-lighter)', padding: 20, borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: 15 }}>
            <div style={{fontSize: 12, color: 'var(--muted)'}}>Gross Profit / Loss</div>
            <div style={{fontSize: 24, fontWeight: 600, color: profit >= 0 ? 'var(--up)' : 'var(--down)'}}>
              ₹{profit.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ marginBottom: 15 }}>
            <div style={{fontSize: 12, color: 'var(--muted)'}}>Est. Tax Liability</div>
            <div style={{fontSize: 24, fontWeight: 600, color: tax > 0 ? 'var(--down)' : 'inherit'}}>
              ₹{Math.round(tax).toLocaleString('en-IN')}
            </div>
            {holdingPeriod === 'ltcg' && <div style={{fontSize: 10, color: 'var(--muted)', marginTop: 4}}>* Assuming no other LTCG. Exemption of ₹1.25L applies.</div>}
          </div>
          <div style={{ padding: 15, background: profit >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: 6, border: `1px solid ${profit >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
            <div style={{fontSize: 12, color: profit >= 0 ? 'var(--up)' : 'var(--down)'}}>Net Profit after Tax</div>
            <div style={{fontSize: 32, fontWeight: 700, color: profit >= 0 ? 'var(--up)' : 'var(--down)'}}>
              ₹{Math.round(net).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
