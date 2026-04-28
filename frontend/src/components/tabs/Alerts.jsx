import { useState } from 'react'
import { useStore } from '../../store'
import { showToast } from '../Toast'

export default function Alerts() {
  const { alerts, setAlert, clearAlert, watchlist, portfolio, stockCache, backendLive } = useStore()
  const allTickers = [...new Set([...watchlist,...portfolio.map(h=>h.ticker)])]
  const [form, setForm] = useState({ ticker:'', buy:'', target:'', sl:'', email:'', phone:'' })
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  const doSet = async () => {
    if(!form.ticker){showToast('⚠ Select a stock','error');return}
    const b=parseFloat(form.buy)||null, t=parseFloat(form.target)||null, s=parseFloat(form.sl)||null
    if(!b&&!t&&!s){showToast('⚠ Set at least one level','error');return}
    
    // Save to local Zustand store
    setAlert(form.ticker,{buy:b,target:t,sl:s})
    
    // Subscribe to backend email/SMS alerting service if available
    if (backendLive && (form.email || form.phone)) {
      try {
        const res = await fetch('/api/alerts/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: form.ticker, email: form.email, phone: form.phone, buy: b, target: t, sl: s })
        })
        const data = await res.json()
        if (!data.ok) console.warn("Backend alert subscription failed", data.error)
      } catch (e) {
        console.warn("Backend alert fetch failed", e)
      }
    }

    showToast(`✓ Alerts set for ${form.ticker}`)
    setForm(p=>({...p,buy:'',target:'',sl:''}))
  }

  const alTickers = Object.keys(alerts)

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:14}} className="alerts-layout">
      <div>
        <div className="sec"><span className="sec-l">Active Alerts</span><div className="sec-line"/></div>
        {alTickers.length === 0 && <div className="empty-state" style={{height:180}}><div className="empty-icon">◎</div><div className="empty-text">No alerts set</div></div>}
        {alTickers.map(ticker=>{
          const d=stockCache[ticker]; const al=alerts[ticker]||{}
          const cmp=d?.price?.current||0
          const triggered=[]
          if(al.buy&&cmp<=al.buy) triggered.push('Buy Zone ✓')
          if(al.sl&&cmp<=al.sl) triggered.push('SL Hit ⚠')
          if(al.target&&cmp>=al.target) triggered.push('Target Hit 🎯')
          const levels=[
            al.target&&{l:'Target',v:al.target,c:'#00ff88'},
            cmp&&{l:'CMP',v:cmp,c:'#fff'},
            al.buy&&{l:'Buy Zone',v:al.buy,c:'#f5c842'},
            al.sl&&{l:'Stop-Loss',v:al.sl,c:'#ff4560'},
          ].filter(Boolean).sort((a,b)=>b.v-a.v)
          return (
            <div key={ticker} className="card" style={{marginBottom:9}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div>
                  <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>{ticker}</span>
                  <span style={{fontSize:9,color:'var(--muted)',marginLeft:8}}>{d?.company?.name?.substring(0,24)||''}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:(d?.price?.ret1m||0)>=0?'var(--green)':'var(--red)'}}>
                    ₹{cmp.toLocaleString('en-IN',{maximumFractionDigits:0})}
                  </span>
                  {triggered.map(t=><span key={t} className="tag tag-y">{t}</span>)}
                  <button className="btn-sm-red" onClick={()=>{clearAlert(ticker);showToast(`Alerts cleared for ${ticker}`)}}>Clear</button>
                </div>
              </div>
              <div style={{position:'relative',paddingLeft:120,marginBottom:8}}>
                <div style={{position:'absolute',left:110,top:0,bottom:0,width:1,background:'var(--b2)'}}/>
                {levels.map((lvl,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',height:30,position:'relative'}}>
                    <span style={{position:'absolute',right:'calc(100% - 104px)',fontSize:9,color:'var(--muted)',whiteSpace:'nowrap',textAlign:'right'}}>{lvl.l}</span>
                    <div style={{width:9,height:9,borderRadius:'50%',border:`2px solid ${lvl.c}`,position:'absolute',left:-4,background:lvl.v===cmp?'transparent':lvl.c,boxShadow:lvl.v===cmp?`0 0 8px ${lvl.c}`:'none'}}/>
                    <span style={{fontSize:11,fontWeight:600,color:lvl.c,marginLeft:12}}>₹{lvl.v.toLocaleString('en-IN',{maximumFractionDigits:0})}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <div className="card">
          <div className="card-title">Set Price Alert</div>
          <select className="select" style={{marginBottom:8}} value={form.ticker} onChange={e=>f('ticker',e.target.value)}>
            <option value="">Select Stock</option>
            {allTickers.map(t=><option key={t} value={t}>{t}{stockCache[t]?` — ₹${stockCache[t].price?.current?.toLocaleString('en-IN',{maximumFractionDigits:0})}`:''}
            </option>)}
          </select>
          <input className="input" style={{marginBottom:8}} type="number" placeholder="Buy Zone / Entry Price ₹" value={form.buy} onChange={e=>f('buy',e.target.value)}/>
          <input className="input" style={{marginBottom:8}} type="number" placeholder="Target Price ₹" value={form.target} onChange={e=>f('target',e.target.value)}/>
          <input className="input" style={{marginBottom:10}} type="number" placeholder="Stop-Loss ₹" value={form.sl} onChange={e=>f('sl',e.target.value)}/>
          
          <div style={{borderTop:'1px solid var(--b2)',paddingTop:10,marginTop:4,marginBottom:8}}>
            <div style={{fontSize:10,color:'var(--muted)',marginBottom:8}}>Optional: Notify me via Email/SMS when triggered (runs in background)</div>
            <input className="input" style={{marginBottom:8}} type="email" placeholder="Email Address" value={form.email} onChange={e=>f('email',e.target.value)}/>
            <input className="input" style={{marginBottom:10}} type="tel" placeholder="Phone Number (e.g. +91...)" value={form.phone} onChange={e=>f('phone',e.target.value)}/>
          </div>

          <button className="btn-primary" style={{width:'100%'}} onClick={doSet}>Set Alert</button>
        </div>
        <div className="card" style={{marginTop:10}}>
          <div className="card-title">Guide</div>
          <div style={{fontSize:10,color:'var(--muted)',lineHeight:1.9}}>
            <div style={{marginBottom:5}}><span className="cy">● Buy Zone</span> — Entry price with margin of safety</div>
            <div style={{marginBottom:5}}><span className="cg">● Target</span> — Your intrinsic value estimate</div>
            <div><span className="cr">● Stop-Loss</span> — Thesis broken. Exit without emotion.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
