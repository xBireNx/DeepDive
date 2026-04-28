import { useState, useEffect } from 'react'

const MOAT_LABELS = {
  network_effects: 'Network Effects',
  switching_costs: 'Switching Costs',
  cost_advantage: 'Cost Advantage',
  intangible_assets: 'Intangible Assets',
  efficient_scale: 'Efficient Scale',
}

const MOAT_COLOR = { 'Wide Moat': 'var(--green)', 'Narrow Moat': 'var(--yellow)', 'No Moat': 'var(--red)' }
const IMPACT_COLOR = { 'High': 'var(--green)', 'Medium': 'var(--yellow)', 'Low': 'var(--red)' }

export default function StrategicTab({ data }) {
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

  if (!data) return <div className="empty-state"><div className="empty-icon">⊞</div><div className="empty-text">Select a stock first</div></div>
  if (loading) return <div className="empty-state"><div className="empty-icon" style={{animation:'spin 1s linear infinite'}}>◌</div><div className="empty-text">Analysing strategic positioning…</div></div>
  if (error) return <div className="empty-state"><div className="empty-icon">⚠</div><div className="empty-text">{error}</div></div>
  if (!analysis) return null

  const moat = analysis.moat
  const ls = analysis.landscape

  return (
    <div className="fade-in">
      <div className="sec">
        <span className="sec-l">Strategic Analysis — {analysis.symbol}</span>
        <div className="sec-line"/>
        <span style={{fontSize:9, padding:'2px 8px', borderRadius:10, background: analysis.source==='groq' ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)', color: analysis.source==='groq' ? 'var(--green)' : 'var(--muted)', border:`1px solid ${analysis.source==='groq' ? 'rgba(34,197,94,0.4)' : 'rgba(148,163,184,0.3)'}`}}>{analysis.source==='groq' ? '⚡ Groq AI' : '⊟ Template'}</span>
        <span style={{fontSize:9,color:'var(--muted)',marginLeft:6}}>{analysis.sector} · {analysis.industry}</span>
      </div>

      {/* Company Intro */}
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div className="card-title" style={{margin:0}}>{analysis.company}</div>
          {analysis.website && <a href={analysis.website} target="_blank" rel="noreferrer" style={{fontSize:9,color:'var(--brand)',textDecoration:'none'}}>↗ Website</a>}
        </div>
        <p style={{fontSize:11,color:'var(--muted)',lineHeight:1.7,margin:0}}>{analysis.description}</p>
        <div style={{display:'flex',gap:20,marginTop:12}}>
          {analysis.market_cap && <div><div style={{fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1}}>Market Cap</div><div style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>₹{(analysis.market_cap/1e7).toFixed(0)} Cr</div></div>}
          {analysis.revenue && <div><div style={{fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1}}>Revenue</div><div style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>₹{(analysis.revenue/1e7).toFixed(0)} Cr</div></div>}
          {analysis.employees && <div><div style={{fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1}}>Employees</div><div style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>{analysis.employees.toLocaleString()}</div></div>}
        </div>
      </div>

      {/* Moat & Edge */}
      <div className="sec"><span className="sec-l">🏰 Moat &amp; Competitive Edge</span><div className="sec-line"/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div className="card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div className="card-title" style={{margin:0}}>Moat Assessment</div>
            <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:`${MOAT_COLOR[moat.label]}22`,color:MOAT_COLOR[moat.label],border:`1px solid ${MOAT_COLOR[moat.label]}55`}}>{moat.label}</span>
          </div>
          {/* Radar bars */}
          {Object.entries(moat.scores).map(([key, score]) => (
            <div key={key} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                <span style={{fontSize:9,color:'var(--muted)'}}>{MOAT_LABELS[key]||key}</span>
                <span style={{fontSize:9,color:'var(--text)',fontWeight:600}}>{score}/5</span>
              </div>
              <div style={{height:6,background:'var(--bg4)',borderRadius:4,overflow:'hidden'}}>
                <div style={{width:`${score/5*100}%`,height:'100%',borderRadius:4,background:score>=4?'var(--green)':score>=3?'var(--yellow)':'var(--red)',transition:'width 0.6s ease'}}/>
              </div>
            </div>
          ))}
          <div style={{marginTop:12,fontSize:10,color:'var(--text)',lineHeight:1.6,borderTop:'1px solid var(--b2)',paddingTop:10}}>
            <span style={{color:'var(--muted)'}}>Overall Score: </span>
            <span style={{fontWeight:700,color:MOAT_COLOR[moat.label]}}>{moat.overall_score}/5</span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Moat Description</div>
          <p style={{fontSize:11,color:'var(--text)',lineHeight:1.7,marginBottom:12}}>{moat.description}</p>
          <div style={{background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6,padding:'8px 10px'}}>
            <div style={{fontSize:9,color:'var(--red)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Risk to Moat</div>
            <div style={{fontSize:11,color:'var(--muted)',lineHeight:1.6}}>{moat.risk}</div>
          </div>
        </div>
      </div>

      {/* Industry Landscape */}
      <div className="sec"><span className="sec-l">🌐 Industry Landscape</span><div className="sec-line"/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
        {[
          {label:'Market Size', value: ls.market_size},
          {label:'Growth Rate', value: ls.growth_rate},
          {label:'Penetration', value: ls.penetration},
        ].map(k=>(
          <div key={k.label} className="card" style={{padding:'12px 14px',borderLeft:'3px solid var(--brand)'}}>
            <div style={{fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>{k.label}</div>
            <div style={{fontSize:11,fontWeight:600,color:'var(--text)',lineHeight:1.5}}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:14}}>
        <div className="card">
          <div className="card-title" style={{color:'var(--green)'}}>▲ Key Drivers</div>
          {ls.key_drivers.map((d,i)=><div key={i} style={{fontSize:10,color:'var(--muted)',marginBottom:5,paddingLeft:10,borderLeft:'2px solid var(--green)',lineHeight:1.5}}>{d}</div>)}
        </div>
        <div className="card">
          <div className="card-title" style={{color:'var(--yellow)'}}>⚡ Tailwinds</div>
          {ls.tailwinds.map((d,i)=><div key={i} style={{fontSize:10,color:'var(--muted)',marginBottom:5,paddingLeft:10,borderLeft:'2px solid var(--yellow)',lineHeight:1.5}}>{d}</div>)}
        </div>
        <div className="card">
          <div className="card-title" style={{color:'var(--red)'}}>▼ Key Risks</div>
          {ls.risks.map((d,i)=><div key={i} style={{fontSize:10,color:'var(--muted)',marginBottom:5,paddingLeft:10,borderLeft:'2px solid var(--red)',lineHeight:1.5}}>{d}</div>)}
        </div>
      </div>

      {/* Growth Catalysts */}
      <div className="sec"><span className="sec-l">🚀 Growth Catalysts</span><div className="sec-line"/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        {analysis.catalysts.map((cat, i) => (
          <div key={i} className="card" style={{borderLeft:`3px solid ${IMPACT_COLOR[cat.impact]}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--text)',lineHeight:1.4}}>{cat.catalyst}</div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0,marginLeft:10}}>
                <span style={{fontSize:8,padding:'2px 7px',borderRadius:10,background:`${IMPACT_COLOR[cat.impact]}22`,color:IMPACT_COLOR[cat.impact],fontWeight:700}}>{cat.impact} Impact</span>
                <span style={{fontSize:8,color:'var(--muted)'}}>{cat.timeline}</span>
              </div>
            </div>
            <p style={{fontSize:10,color:'var(--muted)',lineHeight:1.6,margin:0}}>{cat.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
