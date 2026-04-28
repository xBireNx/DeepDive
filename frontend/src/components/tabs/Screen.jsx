import { useState } from 'react'
import { useStore } from '../../store'
import { fN, gradeColor } from '../../utils'
import { showToast } from '../Toast'
import SectorRotation from '../widgets/SectorRotation'

export default function Screen() {
  const { stockCache, setActiveStock } = useStore()
  const [filters, setFilters] = useState({ maxPE:'', minROE:'', maxDE:'', minRevGrowth:'', minGrade:'', trend:'Any' })
  const [results, setResults] = useState(null)

  const cached = Object.keys(stockCache)

  const runScreen = () => {
    const res = []
    const go = {A:4,B:3,C:2,D:1,F:0}
    for (const [sym,d] of Object.entries(stockCache)) {
      const r=d.ratios||{}; const f=d.fundamental||{}; const t=d.technical||{}
      const pe=r.pe; const roe=r.roe; const de=r.debt_to_equity
      const rg=r.revenue_growth||r.revGrowth; const grade=f.grade||''; const trend=t.trend||''
      let pass=true
      if(filters.maxPE&&pe&&pe>parseFloat(filters.maxPE)) pass=false
      if(filters.minROE&&roe&&roe<parseFloat(filters.minROE)) pass=false
      if(filters.maxDE&&de&&de>parseFloat(filters.maxDE)) pass=false
      if(filters.minRevGrowth&&rg&&rg<parseFloat(filters.minRevGrowth)) pass=false
      if(filters.minGrade){const g1=go[grade[0]]||0; const g2=go[filters.minGrade]||0; if(g1<g2)pass=false}
      if(filters.trend&&filters.trend!=='Any'&&!trend.toLowerCase().includes(filters.trend.toLowerCase())) pass=false
      if(pass) res.push({ symbol:sym, name:d.company?.name||sym, price:d.price?.current, pe, roe, de, revGrowth:rg, grade, trend, scorePct:f.overallPct||0 })
    }
    res.sort((a,b)=>(b.scorePct||0)-(a.scorePct||0))
    setResults(res)
    showToast(`${res.length} stocks match`)
  }

  const f = (k,v) => setFilters(p=>({...p,[k]:v}))

  return (
    <div>
      <div className="sec">
        <span className="sec-l">Stock Screener — Filter Your Universe</span>
        <div className="sec-line"/>
        <span style={{fontSize:9,color:'var(--muted)'}}>{cached.length} stocks analysed</span>
      </div>
      <SectorRotation />

      {cached.length === 0 ? (
        <div className="empty-state" style={{height:200}}>
          <div className="empty-icon">⊡</div>
          <div className="empty-text">No stocks analysed yet</div>
          <div className="empty-hint">Analyse stocks first using the ▶ Analyse button</div>
        </div>
      ) : (
        <>
          <div className="card" style={{marginBottom:14}}>
            <div className="card-title">Filter Criteria</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:10}}>
              {[['Max P/E','maxPE','e.g. 50'],['Min ROE (%)','minROE','e.g. 15'],['Max D/E','maxDE','e.g. 1.0'],['Min Rev Growth (%)','minRevGrowth','e.g. 20']].map(([l,k,p])=>(
                <div key={k}>
                  <div style={{fontSize:9,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',marginBottom:3}}>{l}</div>
                  <input className="input" type="number" placeholder={p} value={filters[k]} onChange={e=>f(k,e.target.value)}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:9,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',marginBottom:3}}>Min Grade</div>
                <select className="select" value={filters.minGrade} onChange={e=>f('minGrade',e.target.value)}>
                  <option value="">Any</option><option value="A">A or above</option><option value="B">B or above</option><option value="C">C or above</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:9,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',marginBottom:3}}>Trend</div>
                <select className="select" value={filters.trend} onChange={e=>f('trend',e.target.value)}>
                  <option value="Any">Any</option><option value="Uptrend">Uptrend</option><option value="Downtrend">Downtrend</option><option value="Sideways">Sideways</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button className="btn-outline" onClick={()=>{setFilters({maxPE:'',minROE:'',maxDE:'',minRevGrowth:'',minGrade:'',trend:'Any'});setResults(null)}}>Clear</button>
              <button className="btn-primary" onClick={runScreen}>▶ Screen</button>
            </div>
          </div>

          {results !== null && (
            results.length === 0 ? (
              <div className="empty-state" style={{height:160}}>
                <div className="empty-icon">⊡</div>
                <div className="empty-text">No stocks match</div>
                <div className="empty-hint">Relax your criteria or analyse more stocks</div>
              </div>
            ) : (
              <div className="card" style={{padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>{['Stock','Price','P/E','ROE','D/E','Rev Growth','Grade','Trend','Score'].map(h=>(
                      <th key={h} style={{fontSize:8,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',textAlign:'left',padding:'8px 10px',borderBottom:'1px solid var(--b2)'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {results.map(r=>(
                      <tr key={r.symbol} onClick={()=>{setActiveStock(r.symbol);showToast(`Viewing ${r.symbol}`)}}
                        style={{cursor:'pointer',transition:'background 0.1s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--g3)'}
                        onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{padding:'9px 10px',fontWeight:700,color:'#fff',borderBottom:'1px solid var(--b2)'}}>
                          {r.symbol}<br/><span style={{fontSize:8,color:'var(--muted)',fontWeight:400}}>{(r.name||'').substring(0,18)}</span>
                        </td>
                        <td style={{padding:'9px 10px',borderBottom:'1px solid var(--b2)'}}>₹{fN(r.price,'','',0)}</td>
                        <td className={r.pe>60?'cy':r.pe<25?'cg':''} style={{padding:'9px 10px',borderBottom:'1px solid var(--b2)'}}>{fN(r.pe,'','x',1)}</td>
                        <td className={r.roe>15?'cg':r.roe>10?'cy':'cr'} style={{padding:'9px 10px',borderBottom:'1px solid var(--b2)'}}>{fN(r.roe,'','%',1)}</td>
                        <td className={r.de<0.3?'cg':r.de<1?'cy':'cr'} style={{padding:'9px 10px',borderBottom:'1px solid var(--b2)'}}>{fN(r.de,'','x',2)}</td>
                        <td className={r.revGrowth>20?'cg':r.revGrowth>10?'cy':'cr'} style={{padding:'9px 10px',borderBottom:'1px solid var(--b2)'}}>{fN(r.revGrowth,'','%',1)}</td>
                        <td style={{padding:'9px 10px',borderBottom:'1px solid var(--b2)',fontWeight:700,color:gradeColor(r.grade)}}>{r.grade||'?'}</td>
                        <td style={{padding:'9px 10px',borderBottom:'1px solid var(--b2)',fontSize:10}}>{r.trend||'—'}</td>
                        <td style={{padding:'9px 10px',borderBottom:'1px solid var(--b2)',fontWeight:700,color:(r.scorePct||0)>=70?'var(--green)':(r.scorePct||0)>=50?'var(--yellow)':'var(--red)'}}>{r.scorePct||0}%</td>
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
