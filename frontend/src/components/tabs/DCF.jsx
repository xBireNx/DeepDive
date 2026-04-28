import { useState, useCallback } from 'react'
import { fN } from '../../utils'

function Slider({ id, label, value, min, max, step=0.5, unit, desc, onChange }) {
  return (
    <div className="card" style={{marginBottom:9}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:7}}>
        <span style={{fontSize:11,color:'var(--text)'}}>{label}</span>
        <span style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,color:'var(--green)'}}>{value}<span style={{fontSize:10,color:'var(--muted)',fontFamily:'var(--mono)'}}>{unit}</span></span>
      </div>
      <input type="range" id={id} min={min} max={max} step={step} value={value}
        onChange={e=>onChange(parseFloat(e.target.value))}
        style={{width:'100%',height:4,WebkitAppearance:'none',appearance:'none',background:`linear-gradient(to right,var(--green) 0%,var(--green) ${(value-min)/(max-min)*100}%,var(--bg4) ${(value-min)/(max-min)*100}%)`,borderRadius:2,outline:'none',cursor:'pointer'}}
      />
      <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--dim)',marginTop:3}}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
      {desc && <div style={{fontSize:9,color:'var(--muted)',marginTop:5,lineHeight:1.5}}>{desc}</div>}
    </div>
  )
}

function calcDCF(d, {rg1,rg2,marg,disc,termG,yrs}) {
  const baseRevCr = d.ratios?.ps ? (d.company?.market_cap_cr||100) / d.ratios.ps : (d.company?.market_cap_cr||100) / 5
  let rev = baseRevCr, pvFCF = 0, flows = []
  for (let i=1; i<=yrs; i++) {
    rev = rev * (1 + (i<=5?rg1:rg2)/100)
    const fcf = rev * (marg/100) * 0.7
    const pv = fcf / Math.pow(1+disc/100, i)
    pvFCF += pv; flows.push({yr:i,fcf,pv})
  }
  const tFCF = flows[flows.length-1].fcf * (1+termG/100)
  const tV = tFCF / (disc/100 - termG/100)
  const pvT = tV / Math.pow(1+disc/100, yrs)
  const totalCr = pvFCF + pvT
  const shares = (d.company?.market_cap_cr||1)*1e7 / (d.price?.current||1)
  const iv = totalCr*1e7 / shares
  return { iv, pvFCFps:pvFCF*1e7/shares, pvTps:pvT*1e7/shares }
}

export default function DCF({ data }) {
  const r = data?.ratios || {}
  const dRG1 = Math.min(Math.max(r.revenue_growth||15, 5), 60)
  const [params, setParams] = useState({ rg1:dRG1, rg2:Math.max(dRG1-10,3), marg:r.profit_margin||8, disc:12, termG:4, yrs:10, mos:30 })

  if (!data) return <div className="empty-state"><div className="empty-icon">⊛</div><div className="empty-text">Select a stock first</div></div>

  const set = (k,v) => setParams(p=>({...p,[k]:v}))
  const res = calcDCF(data, params)
  const {iv, pvFCFps, pvTps} = res
  const cmp = data.price?.current||0
  const buyAt = iv*(1-params.mos/100)
  const mosPct = ((iv-cmp)/iv*100)
  const isUnder = cmp <= buyAt
  const bear = calcDCF(data, {...params, rg1:Math.max(params.rg1-10,2), rg2:Math.max(params.rg2-5,1), marg:params.marg-3, disc:params.disc+2, termG:params.termG-1})
  const bull = calcDCF(data, {...params, rg1:params.rg1+10, rg2:params.rg2+5, marg:params.marg+3, disc:params.disc-1, termG:params.termG+1})
  const total = pvFCFps + pvTps || 1

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 296px',gap:14}} className="dcf-layout">
      <div>
        <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:12}}>
          <div style={{fontFamily:'var(--display)',fontSize:20,fontWeight:700,color:'#fff'}}>{data.symbol} — DCF Valuation</div>
          <div style={{fontSize:9,color:'var(--muted)'}}>Adjust assumptions → see intrinsic value</div>
        </div>
        {[
          ['rg1','Revenue Growth Yr 1–5',params.rg1,'%','Expected annual revenue growth years 1–5. Be conservative.',2,80],
          ['rg2','Revenue Growth Yr 6–10',params.rg2,'%','Growth decelerates. Use GDP+premium for stable businesses.',1,50],
          ['marg','Net Profit Margin',params.marg,'%','Sustainable net margin. Use trailing average, not peak.',1,40],
          ['disc','Discount Rate (WACC)',params.disc,'%','Your required return. 12–15% for Indian small/mid caps.',8,20],
          ['termG','Terminal Growth Rate',params.termG,'%','Long-term GDP-like growth. Must be < discount rate.',1,7],
          ['yrs','Projection Years',params.yrs,' yrs','Years of above-average growth projected.',5,15,1],
          ['mos','Margin of Safety',params.mos,'%','Buffett buys at 25–50% discount to intrinsic value.',10,60],
        ].map(([id,lbl,val,unit,desc,mn,mx,stp])=>(
          <Slider key={id} id={id} label={lbl} value={val} min={mn} max={mx} step={stp||0.5} unit={unit} desc={desc} onChange={v=>set(id,v)}/>
        ))}
      </div>
      <div style={{position:'sticky',top:0}}>
        <div className="card" style={{textAlign:'center',marginBottom:10,border:'1px solid var(--border)'}}>
          <div style={{fontSize:9,color:'var(--muted)',letterSpacing:2,textTransform:'uppercase',marginBottom:5}}>Intrinsic Value</div>
          <div style={{fontFamily:'var(--display)',fontSize:38,fontWeight:800,color:'var(--green)',lineHeight:1}}>
            ₹{Math.round(iv).toLocaleString('en-IN')}<span style={{fontSize:9,color:'var(--muted)',fontFamily:'var(--mono)'}}>/sh</span>
          </div>
          <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>Current: ₹{cmp.toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
          <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--b2)'}}>
            <div style={{fontSize:9,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase'}}>Margin of Safety</div>
            <div style={{fontSize:22,fontWeight:700,marginTop:3,color:mosPct>=0?'var(--green)':'var(--red)'}}>{mosPct>=0?'+':''}{mosPct.toFixed(1)}%</div>
          </div>
          <div style={{marginTop:10,padding:'9px 12px',borderRadius:6,background:isUnder?'rgba(0,255,136,0.08)':'rgba(255,69,96,0.08)',border:`1px solid ${isUnder?'rgba(0,255,136,0.3)':'rgba(255,69,96,0.3)'}`,color:isUnder?'var(--green)':'var(--red)',fontSize:11,textAlign:'left',lineHeight:1.6}}>
            {isUnder?`✓ Below intrinsic value. Buy below ₹${Math.round(buyAt).toLocaleString('en-IN')} for ${params.mos}% MOS.`:`⚠ Above intrinsic value. Wait for ₹${Math.round(buyAt).toLocaleString('en-IN')} or lower.`}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7,marginTop:12}}>
            {[['Bear',bear.iv,'var(--red)'],['Base',iv,'var(--yellow)'],['Bull',bull.iv,'var(--green)']].map(([l,v,c])=>{
              const m=((v-cmp)/v*100)
              return (
                <div key={l} style={{background:'var(--bg3)',border:'1px solid var(--b2)',borderRadius:6,padding:9,textAlign:'center'}}>
                  <div style={{fontSize:8,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',marginBottom:3}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:700,color:c}}>₹{Math.round(v).toLocaleString('en-IN')}</div>
                  <div style={{fontSize:9,color:m>=0?'var(--green)':'var(--red)',marginTop:2}}>{m>=0?'+':''}{m.toFixed(0)}% MOS</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Value Decomposition</div>
          {[['FCF PV',pvFCFps,'var(--blue)'],['Terminal PV',pvTps,'var(--purple)']].map(([l,v,c])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
              <span style={{fontSize:9,color:'var(--muted)',width:80,flexShrink:0}}>{l}</span>
              <div style={{flex:1,height:7,background:'var(--bg4)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.min(v/total*100,100).toFixed(0)}%`,background:c,borderRadius:3,transition:'width 0.6s'}}/>
              </div>
              <span style={{fontSize:9,color:'var(--text)',width:55,textAlign:'right'}}>₹{Math.round(v).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
