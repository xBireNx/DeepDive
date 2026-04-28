import { useState } from 'react'
import { useStore } from '../../store'
import { showToast } from '../Toast'

const EMOTIONS = ['','Confident','FOMO','Fearful','Greedy','Patient','Disciplined']

export default function Journal() {
  const { journal, addJournalEntry, removeJournalEntry, watchlist, portfolio } = useStore()
  const allTickers = [...new Set([...watchlist,...portfolio.map(h=>h.ticker)])]
  const [form, setForm] = useState({ ticker:'', action:'BUY', price:'', qty:'', date:new Date().toISOString().split('T')[0], emotion:'', target:'', sl:'', thesis:'' })
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  const doAdd = () => {
    if(!form.ticker){showToast('⚠ Select a stock','error');return}
    addJournalEntry({...form, ts:Date.now()})
    setForm({ticker:'',action:'BUY',price:'',qty:'',date:new Date().toISOString().split('T')[0],emotion:'',target:'',sl:'',thesis:''})
    showToast('✓ Entry logged')
  }

  const buys=journal.filter(j=>j.action==='BUY').length
  const sells=journal.filter(j=>j.action==='SELL').length
  const emotions = EMOTIONS.slice(1)
  const emotionCounts = {}
  emotions.forEach(e=>{emotionCounts[e]=journal.filter(j=>j.emotion===e).length})
  const goodEmotions=['Disciplined','Patient','Confident']

  const actionClass = a => a==='BUY'?'cg':a==='SELL'?'cr':'cy'

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:14}} className="journal-layout">
      <div>
        <div className="card" style={{marginBottom:12}}>
          <div className="card-title" style={{marginBottom:10}}>Log Trade / Observation</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:7,marginBottom:8}}>
            <select className="select" value={form.ticker} onChange={e=>f('ticker',e.target.value)}>
              <option value="">Select Stock</option>
              {allTickers.map(t=><option key={t}>{t}</option>)}
            </select>
            <select className="select" value={form.action} onChange={e=>f('action',e.target.value)}>
              <option value="BUY">BUY</option><option value="SELL">SELL</option><option value="WATCH">WATCH</option>
            </select>
            <input className="input" type="number" placeholder="Price ₹" value={form.price} onChange={e=>f('price',e.target.value)}/>
            <input className="input" type="number" placeholder="Qty" value={form.qty} onChange={e=>f('qty',e.target.value)}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:7,marginBottom:8}}>
            <input className="input" type="date" value={form.date} onChange={e=>f('date',e.target.value)}/>
            <select className="select" value={form.emotion} onChange={e=>f('emotion',e.target.value)}>
              {EMOTIONS.map(e=><option key={e} value={e}>{e||'Emotion?'}</option>)}
            </select>
            <input className="input" type="number" placeholder="Target ₹" value={form.target} onChange={e=>f('target',e.target.value)}/>
            <input className="input" type="number" placeholder="Stop-Loss ₹" value={form.sl} onChange={e=>f('sl',e.target.value)}/>
          </div>
          <textarea className="input" style={{height:70,resize:'vertical',lineHeight:1.6}} placeholder="Investment thesis — Why? What catalyst? What breaks the thesis?" value={form.thesis} onChange={e=>f('thesis',e.target.value)}/>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
            <button className="btn-primary" onClick={doAdd}>+ Log Entry</button>
          </div>
        </div>

        {journal.length === 0 && <div className="empty-state" style={{height:160}}><div className="empty-icon">◩</div><div className="empty-text">No entries yet</div></div>}

        {journal.map((j,i)=>{
          const ac=j.action==='BUY'?{background:'rgba(0,255,136,0.1)',color:'var(--green)',border:'1px solid rgba(0,255,136,0.2)'}:j.action==='SELL'?{background:'rgba(255,69,96,0.1)',color:'var(--red)',border:'1px solid rgba(255,69,96,0.2)'}:{background:'rgba(245,200,66,0.1)',color:'var(--yellow)',border:'1px solid rgba(245,200,66,0.2)'}
          return (
            <div key={i} className="card" style={{marginBottom:9,position:'relative'}}>
              <button className="wl-remove" style={{position:'absolute',right:10,top:10,display:'flex'}} onClick={()=>{removeJournalEntry(i);showToast('Entry deleted')}}>✕</button>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5,flexWrap:'wrap'}}>
                <span style={{fontSize:10,fontWeight:700,color:'var(--green)',background:'var(--g3)',border:'1px solid rgba(0,255,136,0.2)',padding:'2px 7px',borderRadius:3}}>{j.ticker}</span>
                <span style={{fontSize:9,fontWeight:600,padding:'2px 7px',borderRadius:3,...ac}}>{j.action}</span>
                <span style={{fontSize:9,color:'var(--muted)'}}>{j.date}</span>
                {j.emotion&&<span style={{fontSize:9,color:'var(--muted)'}}>{j.emotion}</span>}
              </div>
              <div style={{fontSize:11,color:'var(--muted)',lineHeight:1.7}}>{j.thesis||'No thesis recorded.'}</div>
              <div style={{display:'flex',gap:12,marginTop:6,flexWrap:'wrap'}}>
                {j.price&&<div style={{fontSize:9,color:'var(--muted)'}}>Price <span style={{color:'var(--text)'}}>₹{j.price}</span></div>}
                {j.qty&&<div style={{fontSize:9,color:'var(--muted)'}}>Qty <span style={{color:'var(--text)'}}>{j.qty}</span></div>}
                {j.target&&<div style={{fontSize:9,color:'var(--muted)'}}>Target <span style={{color:'var(--green)'}}>₹{j.target}</span></div>}
                {j.sl&&<div style={{fontSize:9,color:'var(--muted)'}}>SL <span style={{color:'var(--red)'}}>₹{j.sl}</span></div>}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div className="card">
          <div className="card-title">Stats</div>
          {[['Total',journal.length,''],['Buys',buys,'cg'],['Sells',sells,'cr'],['Stocks',[...new Set(journal.map(j=>j.ticker))].length,'']].map(([l,v,c])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--b2)',fontSize:10}}>
              <span style={{color:'var(--muted)'}}>{l}</span><span className={c} style={{fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Behavioral Tracker</div>
          {emotions.map(e=>{
            const n=emotionCounts[e]||0
            const col=goodEmotions.includes(e)?'var(--green)':'var(--red)'
            return (
              <div key={e} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:9,color:'var(--muted)',width:78}}>{e}</span>
                <div style={{flex:1,height:4,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:journal.length?`${n/journal.length*100}%`:'0%',background:col,borderRadius:2}}/>
                </div>
                <span style={{fontSize:9,color:'var(--text)',width:16,textAlign:'right'}}>{n}</span>
              </div>
            )
          })}
          <div style={{marginTop:10,fontSize:9,color:'var(--muted)',lineHeight:1.7,borderTop:'1px solid var(--b2)',paddingTop:8}}>Buffett: "The most important quality for an investor is temperament, not intellect."</div>
        </div>
      </div>
    </div>
  )
}
