import { useState } from 'react'

function calcPosition(pf, cmp, sl, riskPct, winRate, rr) {
  if (!pf||!cmp||!sl||cmp<=sl) return null
  const maxRisk = pf*(riskPct/100)
  const perShare = cmp-sl
  const ffShares = Math.floor(maxRisk/perShare)
  const lossRate = 1-winRate/100
  const fullKelly = (winRate/100*rr-lossRate)/rr
  const halfKelly = Math.max(fullKelly/2,0)
  const kShares = Math.floor(pf*halfKelly/cmp)
  const rec = Math.min(ffShares, kShares)
  const amount = rec*cmp
  return { rec, amount, ffShares, kShares, fullKelly, halfKelly, maxRisk, perShare, weight:pf>0?amount/pf*100:0 }
}

export default function Sizer({ data }) {
  const cmp = data?.price?.current||0
  const [pf,setPf] = useState(1000000)
  const [price,setPrice] = useState(cmp)
  const [sl,setSl] = useState(0)
  const [risk,setRisk] = useState(2)
  const [win,setWin] = useState(60)
  const [rr,setRr] = useState(2)

  const res = calcPosition(pf, price||cmp, sl, risk, win, rr)

  return (
    <div>
      <div className="sec"><span className="sec-l">Position Sizing Calculator{data?` — ${data.symbol}`:''}</span><div className="sec-line"/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div>
          <div className="card">
            <div className="card-title">Kelly Criterion + Fixed Fractional</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[
                ['Portfolio Size (₹)',pf,setPf,'number','e.g. 1000000'],
                ['Current Price (₹)',price||cmp,setPrice,'number',`e.g. ${cmp}`],
                ['Stop-Loss Price (₹)',sl,setSl,'number',`e.g. ${Math.round(cmp*0.9)}`],
                ['Max Risk per Trade (%)',risk,setRisk,'number','e.g. 2'],
                ['Win Rate (%)',win,setWin,'number','Your estimate, e.g. 60'],
                ['Reward / Risk Ratio',rr,setRr,'number','e.g. 2'],
              ].map(([l,v,s,t,p])=>(
                <div key={l}>
                  <div style={{fontSize:9,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',marginBottom:3}}>{l}</div>
                  <input className="input" type={t} placeholder={p} value={v} onChange={e=>s(parseFloat(e.target.value)||0)}/>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{marginTop:10}}>
            <div className="card-title">Kelly Criterion Explained</div>
            <div style={{fontSize:10,color:'var(--muted)',lineHeight:1.8}}>
              <div style={{marginBottom:6}}><span style={{color:'var(--text)'}}>Full Kelly</span> = (Win Rate × RR − Loss Rate) / RR</div>
              <div style={{marginBottom:6}}><span style={{color:'var(--text)'}}>Half Kelly</span> = Full Kelly / 2 (recommended — less volatility)</div>
              <div style={{marginBottom:6}}><span style={{color:'var(--text)'}}>Fixed Fractional</span> = Max Risk ÷ Per-Share Risk</div>
              <div style={{borderTop:'1px solid var(--b2)',paddingTop:8,marginTop:4}}>We use the smaller of the two for safety. Never risk more than 2% of portfolio on a single trade.</div>
            </div>
          </div>
        </div>

        <div>
          {res ? (
            <>
              <div className="card" style={{textAlign:'center',marginBottom:10,border:'1px solid var(--border)'}}>
                <div style={{fontFamily:'var(--display)',fontSize:36,fontWeight:800,color:'var(--green)'}}>{res.rec.toLocaleString('en-IN')}</div>
                <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>Recommended Shares</div>
                <div style={{fontSize:14,fontWeight:700,color:'#fff',marginTop:8}}>₹{res.amount.toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
                <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{res.weight.toFixed(1)}% of portfolio</div>
              </div>
              <div className="card">
                <div className="card-title">Breakdown</div>
                <table className="stbl"><tbody>
                  {[
                    [`Max Risk (${risk}%)`, `₹${res.maxRisk.toLocaleString('en-IN',{maximumFractionDigits:0})}`],
                    ['Per-share risk', `₹${res.perShare.toFixed(1)}`],
                    ['Fixed Fractional shares', res.ffShares],
                    ['Full Kelly %', `${(res.fullKelly*100).toFixed(1)}%`],
                    ['Half Kelly shares', res.kShares],
                    ['Recommended (min of both)', `${res.rec} shares`],
                  ].map(([l,v])=>(
                    <tr key={l}><td className="tl">{l}</td><td className="tm" style={{textAlign:'right',color:'var(--green)',fontWeight:600}}>{v}</td></tr>
                  ))}
                </tbody></table>
              </div>
            </>
          ) : (
            <div className="card" style={{padding:20,textAlign:'center',color:'var(--muted)',fontSize:11}}>
              Enter portfolio size, current price, and stop-loss to calculate position size.<br/><br/>
              Stop-loss must be below current price.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
