import { useState } from 'react'
import { useStore } from '../../store'
import { fN, gradeColor } from '../../utils'
import { SectorPie, GradeBar } from '../charts'
import { showToast } from '../Toast'

export default function Portfolio() {
  const { portfolio, addHolding, removeHolding, stockCache } = useStore()
  const [form, setForm] = useState({ ticker:'', qty:'', buyPrice:'', date:new Date().toISOString().split('T')[0] })
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  let totalInv=0, totalCurr=0, sectorMap={}, gradeMap={A:0,B:0,C:0,D:0}
  portfolio.forEach(h=>{
    const d=stockCache[h.ticker]
    const curr=h.qty*(d?.price?.current||h.buyPrice), inv=h.qty*h.buyPrice
    totalInv+=inv; totalCurr+=curr
    const sec=d?.company?.sector||h.ticker
    sectorMap[sec]=(sectorMap[sec]||0)+curr
    const g=d?.fundamental?.grade?.[0]||'D'
    gradeMap[g]=(gradeMap[g]||0)+1
  })
  const pnl=totalCurr-totalInv, pct=totalInv>0?pnl/totalInv*100:0
  const pc=pnl>=0?'var(--green)':'var(--red)'

  const doAdd = () => {
    const t=form.ticker.trim().toUpperCase(); const q=parseInt(form.qty); const bp=parseFloat(form.buyPrice)
    if(!t||!q||!bp){showToast('⚠ Fill all fields','error');return}
    addHolding({ticker:t,qty:q,buyPrice:bp,date:form.date})
    setForm({ticker:'',qty:'',buyPrice:'',date:new Date().toISOString().split('T')[0]})
    showToast(`✓ ${t} × ${q} added`)
  }

  return (
    <div>
      <div className="g4" style={{marginBottom:12}}>
        {[['Invested',`₹${totalInv.toLocaleString('en-IN',{maximumFractionDigits:0})}`,''],
          ['Current',`₹${totalCurr.toLocaleString('en-IN',{maximumFractionDigits:0})}`,pnl>=0?'g':'r'],
          ['Total P&L',`${pnl>=0?'+':''}₹${Math.abs(pnl).toLocaleString('en-IN',{maximumFractionDigits:0})}`,pnl>=0?'g':'r'],
          ['Overall Return',`${pct>=0?'+':''}${pct.toFixed(1)}%`,pct>=0?'g':'r']].map(([l,v,c])=>(
          <div key={l} className="stat-card"><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:14}} className="portfolio-layout">
        <div>
          <div className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1.2fr 70px 85px 85px auto',gap:7,padding:'11px 13px',background:'var(--bg3)',borderBottom:'1px solid var(--b2)'}}>
              {[['ticker','Ticker (e.g. KRN)'],['qty','Qty'],['buyPrice','Buy ₹'],['date','Date']].map(([k,p])=>(
                <input key={k} className="input" placeholder={p}
                  value={form[k]} type={k==='qty'||k==='buyPrice'?'number':k==='date'?'date':'text'}
                  onChange={e=>f(k,k==='ticker'?e.target.value.toUpperCase():e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&doAdd()}/>
              ))}
              <button className="btn-primary" onClick={doAdd}>+ Add</button>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr>{['Stock','Qty','Buy','CMP','P&L','Return','Weight','Grade',''].map(h=>(
                <th key={h} style={{fontSize:8,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',textAlign:'left',padding:'7px 9px',borderBottom:'1px solid var(--b2)'}}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {portfolio.length === 0 && (
                  <tr><td colSpan={9} style={{textAlign:'center',color:'var(--muted)',padding:24,fontSize:11}}>No holdings. Add your first position above.</td></tr>
                )}
                {portfolio.map((h,i)=>{
                  const d=stockCache[h.ticker]; const cmp=d?.price?.current||null
                  const curr=cmp?h.qty*cmp:null; const inv=h.qty*h.buyPrice
                  const rowPnl=curr?curr-inv:null; const rowPct=curr&&inv?rowPnl/inv*100:null
                  const wt=totalCurr&&curr?(curr/totalCurr*100).toFixed(1):'—'
                  const rc=rowPnl>=0?'cg':'cr'
                  return (
                    <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='var(--g3)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{padding:'8px 9px',fontWeight:700,color:'#fff',borderBottom:'1px solid var(--b2)'}}>{h.ticker}{!d&&<span style={{fontSize:8,color:'var(--muted)'}}> (not analysed)</span>}</td>
                      <td style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)'}}>{h.qty}</td>
                      <td style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)'}}>₹{h.buyPrice.toLocaleString('en-IN')}</td>
                      <td style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)'}}>{cmp?`₹${cmp.toLocaleString('en-IN',{maximumFractionDigits:0})}`:'—'}</td>
                      <td className={rowPnl!==null?rc:'cd'} style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)'}}>{rowPnl!==null?`${rowPnl>=0?'+':''}₹${Math.abs(rowPnl).toLocaleString('en-IN',{maximumFractionDigits:0})}`:'—'}</td>
                      <td className={rowPct!==null?rc:'cd'} style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)'}}>{rowPct!==null?`${rowPct>=0?'+':''}${rowPct.toFixed(1)}%`:'—'}</td>
                      <td style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)'}}>{wt}%</td>
                      <td style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)',color:gradeColor(d?.fundamental?.grade),fontWeight:700}}>{d?.fundamental?.grade||'?'}</td>
                      <td style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)'}}>
                        <button className="btn-sm-red" onClick={()=>{removeHolding(i);showToast(`${h.ticker} removed`)}}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div className="chart-card"><div className="chart-title">Sector Exposure</div><SectorPie data={sectorMap}/></div>
          <div className="chart-card"><div className="chart-title">Grade Mix</div><GradeBar data={gradeMap}/></div>
          <div className="card">
            <div className="card-title">Concentration Risk</div>
            {portfolio.length ? portfolio.map(h=>{
              const d=stockCache[h.ticker]; const w=totalCurr&&d?.price?.current?(h.qty*d.price.current/totalCurr*100).toFixed(1):0
              return (
                <div key={h.ticker} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:9,color:'var(--muted)',width:70}}>{h.ticker}</span>
                  <div style={{flex:1,height:4,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${w}%`,background:w>25?'var(--red)':w>15?'var(--yellow)':'var(--green)',borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:9,color:'var(--text)',width:32,textAlign:'right'}}>{w}%</span>
                </div>
              )
            }) : <div style={{fontSize:10,color:'var(--muted)'}}>Add holdings to see risk</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
