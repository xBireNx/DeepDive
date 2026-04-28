import { useState } from 'react'

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function Calculators() {
  const [calcType, setCalcType] = useState('sip')

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
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Calculators</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setCalcType('sip')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: calcType === 'sip' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: calcType === 'sip' ? '#000' : 'var(--text-secondary)'
          }}
        >
          SIP
        </button>
        <button
          onClick={() => setCalcType('tax')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: calcType === 'tax' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: calcType === 'tax' ? '#000' : 'var(--text-secondary)'
          }}
        >
          Tax
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>Inputs</div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: 'var(--text-secondary)' }}>Monthly Investment (₹)</label>
          <input type="number" className="input" value={monthly} onChange={e => setMonthly(Number(e.target.value))} style={{ marginBottom: 8 }} />
          <input type="range" min="500" max="100000" step="500" value={monthly} onChange={e => setMonthly(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: 'var(--text-secondary)' }}>Time Period (Years)</label>
          <input type="number" className="input" value={years} onChange={e => setYears(Number(e.target.value))} style={{ marginBottom: 8 }} />
          <input type="range" min="1" max="40" value={years} onChange={e => setYears(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: 'var(--text-secondary)' }}>Expected Return (%)</label>
          <input type="number" className="input" value={rate} onChange={e => setRate(Number(e.target.value))} style={{ marginBottom: 8 }} />
          <input type="range" min="1" max="30" value={rate} onChange={e => setRate(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="panel" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>Total Investment</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>₹{invested.toLocaleString('en-IN')}</div>
        </div>
        <div className="panel" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>Est. Returns</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gain)', fontFamily: 'var(--font-mono)' }}>₹{returns.toLocaleString('en-IN')}</div>
        </div>
        <div className="panel" style={{ padding: 20, textAlign: 'center', border: '2px solid var(--accent-primary)', background: 'var(--accent-dim)' }}>
          <div style={{ fontSize: 11, color: 'var(--accent-primary)', marginBottom: 6, fontWeight: 600 }}>Total Wealth</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>₹{wealth.toLocaleString('en-IN')}</div>
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>Inputs</div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 16 }}>STCG: 20% | LTCG: 12.5% over ₹1.25L</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 11, color: 'var(--text-secondary)' }}>Buy Price (₹)</label>
            <input type="number" className="input" value={buyPrice} onChange={e => setBuyPrice(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 11, color: 'var(--text-secondary)' }}>Sell Price (₹)</label>
            <input type="number" className="input" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 11, color: 'var(--text-secondary)' }}>Quantity</label>
          <input type="number" className="input" value={qty} onChange={e => setQty(Number(e.target.value))} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: 'var(--text-secondary)' }}>Holding Period</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setHoldingPeriod('stcg')} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 10, border: 'none', cursor: 'pointer', background: holdingPeriod === 'stcg' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: holdingPeriod === 'stcg' ? '#000' : 'var(--text-secondary)' }}>STCG</button>
            <button onClick={() => setHoldingPeriod('ltcg')} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 10, border: 'none', cursor: 'pointer', background: holdingPeriod === 'ltcg' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: holdingPeriod === 'ltcg' ? '#000' : 'var(--text-secondary)' }}>LTCG</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="panel" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>Profit / Loss</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: profit >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
            ₹{profit.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="panel" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>Tax Liability</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: tax > 0 ? 'var(--loss)' : 'var(--text-dim)' }}>
            ₹{Math.round(tax).toLocaleString('en-IN')}
          </div>
          {holdingPeriod === 'ltcg' && <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>* ₹1.25L exemption</div>}
        </div>
        <div className="panel" style={{ padding: 20, textAlign: 'center', border: '2px solid', borderColor: profit >= 0 ? 'var(--gain)' : 'var(--loss)', background: profit >= 0 ? 'var(--gain-dim)' : 'var(--loss-dim)' }}>
          <div style={{ fontSize: 11, color: profit >= 0 ? 'var(--gain)' : 'var(--loss)', marginBottom: 6, fontWeight: 600 }}>Net Profit</div>
          <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: profit >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
            ₹{Math.round(net).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  )
}