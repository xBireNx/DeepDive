import { useState, useEffect } from 'react'

const MOAT_LABELS = {
  network_effects: 'Network Effects',
  switching_costs: 'Switching Costs',
  cost_advantage: 'Cost Advantage',
  intangible_assets: 'Intangible Assets',
  efficient_scale: 'Efficient Scale',
}

const PORTER_LABELS = {
  rivalry: 'Competitive Rivalry',
  threat_new: 'New Entrant Threat',
  threat_sub: 'Substitute Threat',
  bargaining_buyer: 'Buyer Power',
  bargaining_supplier: 'Supplier Power',
}

const MOAT_COLOR = { 'Wide Moat': 'var(--gain)', 'Narrow Moat': 'var(--warning)', 'No Moat': 'var(--loss)' }
const IMPACT_COLOR = { 'High': 'var(--gain)', 'Medium': 'var(--warning)', 'Low': 'var(--loss)' }
const SCORE_COLOR = (score) => score >= 4 ? 'var(--gain)' : score >= 3 ? 'var(--warning)' : 'var(--loss)'

const SecHeader = ({ label, collapsed, onToggle, badge }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    {badge && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-dim)', marginLeft: 8 }}>{badge}</span>}
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

const ScoreBar = ({ label, score, detail }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
      <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{label}</span>
      <span style={{ fontSize: 9, fontWeight: 600, color: SCORE_COLOR(score) }}>{score}/5</span>
    </div>
    <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${score/5*100}%`, height: '100%', background: SCORE_COLOR(score), borderRadius: 2, transition: 'width 0.3s ease' }} />
    </div>
    {detail && <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>{detail}</div>}
  </div>
)

const Pill = ({ children, color }) => (
  <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 8, background: `${color}20`, color, fontWeight: 700 }}>
    {children}
  </span>
)

export default function StrategicTab({ data }) {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const symbol = data?.symbol

  useEffect(() => {
    if (!symbol) return
    setLoading(true); setError(null); setAnalysis(null)
    fetch(`/api/strategic/${symbol}`)
      .then(r => r.json())
      .then(res => { if (res.ok) setAnalysis(res.data); else setError(res.error || 'Failed') })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [symbol])

  useEffect(() => {
    if (analysis) {
      setCollapsed({
        company: false,
        moat: false,
        landscape: false,
        catalysts: false,
        swot: true,
        porters: true,
        management: false,
        competitive: true,
      })
    }
  }, [analysis])

  if (!data) return <div className="empty-state"><div className="empty-icon">⊞</div><div className="empty-title">Select a stock first</div></div>
  if (loading) return <div className="empty-state"><div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><div className="empty-title">Analysing...</div></div>
  if (error) return <div className="empty-state"><div className="empty-icon">⚠</div><div className="empty-title">{error}</div></div>
  if (!analysis) return null

  const moat = analysis.moat || {}
  const ls = analysis.landscape || { market_size: '', growth_rate: '', penetration: '', key_drivers: [], risks: [], tailwinds: [] }
  const swot = analysis.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] }
  const porters = analysis.porters || { rivalry: 0, rivalry_detail: '', threat_new: 0, threat_new_detail: '', threat_sub: 0, threat_sub_detail: '', bargaining_buyer: 0, bargaining_buyer_detail: '', bargaining_supplier: 0, bargaining_supplier_detail: '' }
  const mgmt = analysis.management || { score: 0, promoter_skin: 0, promoter_detail: '', exec_detail: '', capital_allocation: 0, capital_detail: '', esg_score: 0, esg_detail: '' }
  const comp = analysis.competitive || { market_share: '', position: '', advantages: [], vs_peers: { strength: '', weakness: '' } }
  const catalystsArr = analysis.catalysts || []

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
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{analysis.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>Strategic Analysis</span>
          </div>
          <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: analysis.source === 'groq' ? 'var(--gain-dim)' : 'var(--bg-tertiary)', color: analysis.source === 'groq' ? 'var(--gain)' : 'var(--text-dim)', border: `1px solid ${analysis.source === 'groq' ? 'var(--gain)' : 'var(--border-default)'}` }}>
            {analysis.source === 'groq' ? '⚡ AI' : '⊟ Template'}
          </span>
        </div>
      </div>

      <SecHeader label="Company" collapsed={collapsed.company} onToggle={() => toggleSection('company')} />
      {!collapsed.company && (
        <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{analysis.company}</div>
            {analysis.website && <a href={analysis.website} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'var(--accent-primary)', textDecoration: 'none' }}>↗ Website</a>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>{analysis.description}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {analysis.market_cap && <div><div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Market Cap</div><div style={{ fontSize: 12, fontWeight: 700 }}>{'₹' + (analysis.market_cap/1e7).toFixed(0) + ' Cr'}</div></div>}
            {analysis.revenue && <div><div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Revenue</div><div style={{ fontSize: 12, fontWeight: 700 }}>{'₹' + (analysis.revenue/1e7).toFixed(0) + ' Cr'}</div></div>}
            {analysis.employees && <div><div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Employees</div><div style={{ fontSize: 12, fontWeight: 700 }}>{analysis.employees.toLocaleString()}</div></div>}
            <div><span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Sector</span><span style={{ fontSize: 12, fontWeight: 700 }}>{analysis.sector}</span></div>
            {analysis.industry != null && analysis.industry.length > 0 && analysis.industry !== '—' && <span><span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Industry</span><span style={{ fontSize: 12, fontWeight: 700 }}>{analysis.industry}</span></span>}
          </div>
        </div>
      )}

      <SecHeader label="Moat Assessment" collapsed={collapsed.moat} onToggle={() => toggleSection('moat')} badge={moat.label} />
      {!collapsed.moat && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Moat Components</span>
              <Pill color={MOAT_COLOR[moat.label]}>{moat.overall_score}/5</Pill>
            </div>
            {Object.entries(moat.scores || {}).map(([key, score]) => (
              <ScoreBar key={key} label={MOAT_LABELS[key] || key} score={score} />
            ))}
          </div>

          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6 }}>Assessment</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>{moat.description}</div>
            <div style={{ padding: 8, borderRadius: 6, background: 'var(--loss-dim)', border: '1px solid var(--loss)' }}>
              <div style={{ fontSize: 9, color: 'var(--loss)', textTransform: 'uppercase', marginBottom: 3 }}>⚠ Moat Risk</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{moat.risk}</div>
            </div>
          </div>
        </div>
      )}

      <SecHeader label="Industry Landscape" collapsed={collapsed.landscape} onToggle={() => toggleSection('landscape')} />
      {!collapsed.landscape && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[{ label: 'Market Size', value: ls.market_size }, { label: 'Growth Rate', value: ls.growth_rate }, { label: 'Penetration', value: ls.penetration }].map(k => (
              <div key={k.label} className="panel" style={{ padding: 10, borderLeft: '3px solid var(--accent-primary)' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{k.label}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{k.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div className="panel" style={{ padding: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--gain)', marginBottom: 6 }}>▲ Drivers</div>
              {(ls.key_drivers || []).map((d, i) => <div key={i} style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 3, paddingLeft: 6, borderLeft: '2px solid var(--gain)' }}>{d}</div>)}
            </div>
            <div className="panel" style={{ padding: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--warning)', marginBottom: 6 }}>⚡ Tailwinds</div>
              {(ls.tailwinds || []).map((d, i) => <div key={i} style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 3, paddingLeft: 6, borderLeft: '2px solid var(--warning)' }}>{d}</div>)}
            </div>
            <div className="panel" style={{ padding: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--loss)', marginBottom: 6 }}>▼ Risks</div>
              {(ls.risks || []).map((d, i) => <div key={i} style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 3, paddingLeft: 6, borderLeft: '2px solid var(--loss)' }}>{d}</div>)}
            </div>
          </div>
        </div>
      )}

      <SecHeader label="Growth Catalysts" collapsed={collapsed.catalysts} onToggle={() => toggleSection('catalysts')} />
      {!collapsed.catalysts && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {catalystsArr.map((cat, i) => (
            <div key={i} className="panel" style={{ padding: 12, borderLeft: `3px solid ${IMPACT_COLOR[cat.impact]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{cat.catalyst}</div>
                <Pill color={IMPACT_COLOR[cat.impact]}>{cat.impact}</Pill>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{cat.detail}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 6 }}>{cat.timeline}</div>
            </div>
          ))}
        </div>
      )}

      <SecHeader label="SWOT Analysis" collapsed={collapsed.swot} onToggle={() => toggleSection('swot')} />
      {!collapsed.swot && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div className="panel" style={{ padding: 12, borderTop: '3px solid var(--gain)' }}>
            <div style={{ fontSize: 10, color: 'var(--gain)', fontWeight: 700, marginBottom: 8 }}>STRENGTHS</div>
            {(swot.strengths || []).map((s, i) => <div key={i} style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 4, paddingLeft: 8 }}>• {s}</div>)}
          </div>
          <div className="panel" style={{ padding: 12, borderTop: '3px solid var(--warning)' }}>
            <div style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 700, marginBottom: 8 }}>WEAKNESSES</div>
            {(swot.weaknesses || []).map((s, i) => <div key={i} style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 4, paddingLeft: 8 }}>• {s}</div>)}
          </div>
          <div className="panel" style={{ padding: 12, borderTop: '3px solid var(--gain)' }}>
            <div style={{ fontSize: 10, color: 'var(--gain)', fontWeight: 700, marginBottom: 8 }}>OPPORTUNITIES</div>
            {(swot.opportunities || []).map((s, i) => <div key={i} style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 4, paddingLeft: 8 }}>• {s}</div>)}
          </div>
          <div className="panel" style={{ padding: 12, borderTop: '3px solid var(--loss)' }}>
            <div style={{ fontSize: 10, color: 'var(--loss)', fontWeight: 700, marginBottom: 8 }}>THREATS</div>
            {(swot.threats || []).map((s, i) => <div key={i} style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 4, paddingLeft: 8 }}>• {s}</div>)}
          </div>
        </div>
      )}

      <SecHeader label="Porter's Five Forces" collapsed={collapsed.porters} onToggle={() => toggleSection('porters')} />
      {!collapsed.porters && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 10 }}>Force Scores</div>
            {Object.entries(PORTER_LABELS).map(([key, label]) => (
              <ScoreBar key={key} label={label} score={porters[key]} />
            ))}
          </div>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 10 }}>Analysis</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Rivalry</div>
              <div style={{ marginBottom: 8 }}>{porters.rivalry_detail}</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>New Entrants</div>
              <div style={{ marginBottom: 8 }}>{porters.threat_new_detail}</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Substitutes</div>
              <div style={{ marginBottom: 8 }}>{porters.threat_sub_detail}</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Buyer Power</div>
              <div style={{ marginBottom: 8 }}>{porters.bargaining_buyer_detail}</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Supplier Power</div>
              <div>{porters.bargaining_supplier_detail}</div>
            </div>
          </div>
        </div>
      )}

      <SecHeader label="Management & ESG" collapsed={collapsed.management} onToggle={() => toggleSection('management')} />
      {!collapsed.management && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>Overall Score</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: SCORE_COLOR(mgmt.score) }}>{mgmt.score}</div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>/5</div>
          </div>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>Promoter Skin</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: SCORE_COLOR(mgmt.promoter_skin) }}>{mgmt.promoter_skin}</div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>/5</div>
          </div>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>ESG Score</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: mgmt.esg_score >= 70 ? 'var(--gain)' : mgmt.esg_score >= 50 ? 'var(--warning)' : 'var(--loss)' }}>{mgmt.esg_score}</div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>/100</div>
          </div>
        </div>
      )}
      {!collapsed.management && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{mgmt.promoter_detail}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{mgmt.exec_detail}</div>
          </div>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{mgmt.capital_detail}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{mgmt.esg_detail}</div>
          </div>
        </div>
      )}

      <SecHeader label="Competitive Position" collapsed={collapsed.competitive} onToggle={() => toggleSection('competitive')} badge={comp.position} />
      {!collapsed.competitive && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>Market Position</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: comp.position === 'Leader' ? 'var(--gain)' : 'var(--text-primary)' }}>{comp.position}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{comp.market_share}</div>
            </div>
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>Competitive Advantages</div>
              {(comp.advantages || []).map((a, i) => <div key={i} style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 3, paddingLeft: 8 }}>• {a}</div>)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="panel" style={{ padding: 12, borderLeft: '3px solid var(--gain)' }}>
              <div style={{ fontSize: 10, color: 'var(--gain)', marginBottom: 4 }}>vs Peers: Strength</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{comp.vs_peers.strength}</div>
            </div>
            <div className="panel" style={{ padding: 12, borderLeft: '3px solid var(--loss)' }}>
              <div style={{ fontSize: 10, color: 'var(--loss)', marginBottom: 4 }}>vs Peers: Weakness</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{comp.vs_peers.weakness}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}