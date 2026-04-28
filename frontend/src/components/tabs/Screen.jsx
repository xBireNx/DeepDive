import { useState } from 'react'
import { useStore } from '../../store'
import { fN, gradeColor } from '../../utils'
import { showToast } from '../Toast'
import SectorRotation from '../widgets/SectorRotation'

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function Screen() {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  const { stockCache, setActiveStock } = useStore()
  const [filters, setFilters] = useState({ maxPE: '', minROE: '', maxDE: '', minRevGrowth: '', minGrade: '', trend: 'Any' })
  const [results, setResults] = useState(null)

  const cached = Object.keys(stockCache)

  const runScreen = () => {
    const res = []
    const go = { A: 4, B: 3, C: 2, D: 1, F: 0 }
    for (const [sym, d] of Object.entries(stockCache)) {
      const r = d.ratios || {}
      const f = d.fundamental || {}
      const t = d.technical || {}
      const pe = r.pe
      const roe = r.roe
      const de = r.debt_to_equity
      const rg = r.revenue_growth || r.revGrowth
      const grade = f.grade || ''
      const trend = t.trend || ''
      let pass = true
      if (filters.maxPE && pe && pe > parseFloat(filters.maxPE)) pass = false
      if (filters.minROE && roe && roe < parseFloat(filters.minROE)) pass = false
      if (filters.maxDE && de && de > parseFloat(filters.maxDE)) pass = false
      if (filters.minRevGrowth && rg && rg < parseFloat(filters.minRevGrowth)) pass = false
      if (filters.minGrade) {
        const g1 = go[grade[0]] || 0
        const g2 = go[filters.minGrade] || 0
        if (g1 < g2) pass = false
      }
      if (filters.trend && filters.trend !== 'Any' && !trend.toLowerCase().includes(filters.trend.toLowerCase())) pass = false
      if (pass) res.push({ symbol: sym, name: d.company?.name || sym, price: d.price?.current, pe, roe, de, revGrowth: rg, grade, trend, scorePct: f.overallPct || 0 })
    }
    res.sort((a, b) => (b.scorePct || 0) - (a.scorePct || 0))
    setResults(res)
    showToast(`${res.length} stocks match`)
  }

  const f = (k, v) => setFilters(p => ({ ...p, [k]: v }))

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
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Screener</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>{cached.length} stocks</span>
          </div>
        </div>
      </div>

      <SecHeader label="Sector Rotation" collapsed={collapsed.sector} onToggle={() => toggleSection('sector')} />
      {!collapsed.sector && (
        <div style={{ marginBottom: 12 }}>
          <SectorRotation />
        </div>
      )}

      {cached.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 100 }}>
          <div className="empty-title">No stocks analyzed</div>
        </div>
      ) : (
        <>
          <SecHeader label="Filters" collapsed={collapsed.filters} onToggle={() => toggleSection('filters')} />
          {!collapsed.filters && (
            <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                {[
                  ['Max P/E', 'maxPE', 'e.g. 50'],
                  ['Min ROE %', 'minROE', 'e.g. 15'],
                  ['Max D/E', 'maxDE', 'e.g. 1.0'],
                  ['Min Rev Growth %', 'minRevGrowth', 'e.g. 20'],
                ].map(([l, k, p]) => (
                  <div key={k}>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
                    <input className="input" type="number" placeholder={p} value={filters[k]} onChange={e => f(k, e.target.value)} style={{ fontSize: 11 }} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Min Grade</div>
                  <select className="select" value={filters.minGrade} onChange={e => f('minGrade', e.target.value)} style={{ fontSize: 11 }}>
                    <option value="">Any</option>
                    <option value="A">A+</option>
                    <option value="B">B+</option>
                    <option value="C">C+</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Trend</div>
                  <select className="select" value={filters.trend} onChange={e => f('trend', e.target.value)} style={{ fontSize: 11 }}>
                    <option value="Any">Any</option>
                    <option value="Uptrend">Uptrend</option>
                    <option value="Downtrend">Downtrend</option>
                    <option value="Sideways">Sideways</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setFilters({ maxPE: '', minROE: '', maxDE: '', minRevGrowth: '', minGrade: '', trend: 'Any' }); setResults(null) }} style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>Clear</button>
                <button className="btn-primary" onClick={runScreen} style={{ padding: '6px 14px', fontSize: 11, borderRadius: 6 }}>▶ Run</button>
              </div>
            </div>
          )}

          {results !== null && (
            results.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 100 }}>
                <div className="empty-title">No matches</div>
              </div>
            ) : (
              <div className="panel" style={{ padding: 0, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)' }}>
                      {['Stock', 'Price', 'P/E', 'ROE', 'D/E', 'Rev Gr', 'Grade', 'Trend', 'Score'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Stock' ? 'left' : 'right', color: 'var(--text-dim)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.symbol} onClick={() => { setActiveStock(r.symbol); showToast(`Viewing ${r.symbol}`) }} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.symbol}</span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{fN(r.price, '', '', 0)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: r.pe > 60 ? 'var(--warning)' : r.pe < 25 ? 'var(--gain)' : 'inherit' }}>{fN(r.pe, '', 'x', 1)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: r.roe > 15 ? 'var(--gain)' : r.roe > 8 ? 'var(--warning)' : 'var(--loss)' }}>{fN(r.roe, '', '%', 1)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: r.de < 0.3 ? 'var(--gain)' : r.de < 1 ? 'var(--warning)' : 'var(--loss)' }}>{fN(r.de, '', 'x', 2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: r.revGrowth > 20 ? 'var(--gain)' : r.revGrowth > 10 ? 'var(--warning)' : 'var(--loss)' }}>{fN(r.revGrowth, '', '%', 1)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: gradeColor(r.grade) }}>{r.grade || '?'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10 }}>{r.trend || '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: (r.scorePct || 0) >= 70 ? 'var(--gain)' : (r.scorePct || 0) >= 50 ? 'var(--warning)' : 'var(--loss)' }}>{r.scorePct || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}