import { useState } from 'react'
import { useStore, api } from '../../store'
import { fN, gradeColor } from '../../utils'
import { showToast } from '../Toast'

export default function Peers({ data }) {
  const { stockCache, analyseStock } = useStore()
  const [peerData, setPeerData] = useState(null)
  const [peerTicker, setPeerTicker] = useState('')
  const [loading, setLoading] = useState(false)

  if (!data) return <div className="empty-state"><div className="empty-icon">⊞</div><div className="empty-text">Select a stock first</div></div>

  const peers = data.peers || []
  const r = data.ratios || {}

  const metrics = [
    {l:'P/E', v:r.pe, unit:'x', higher:false},
    {l:'P/B', v:r.pb, unit:'x', higher:false},
    {l:'ROE', v:r.roe, unit:'%', higher:true},
    {l:'D/E', v:r.debt_to_equity, unit:'x', higher:false},
    {l:'Net Margin', v:r.profit_margin, unit:'%', higher:true},
    {l:'Rev Growth', v:r.revenue_growth, unit:'%', higher:true},
    {l:'Op Margin', v:r.op_margin, unit:'%', higher:true},
  ]

  const maxVals = { pe:150, pb:20, roe:40, de:3, netMargin:30, revGrowth:60, opMargin:30 }

  const analysePeer = async () => {
    const s = peerTicker.trim().toUpperCase()
    if (!s) return
    setLoading(true)
    try {
      const d = await analyseStock(s)
      setPeerData(d)
      showToast(`✓ ${s} loaded for comparison`)
    } catch(e) { showToast(`⚠ ${e.message}`, 'error') }
    finally { setLoading(false) }
  }

  return (
    <div className="peers-layout">
      <div className="sec"><span className="sec-l">{data.symbol} vs Peers</span><div className="sec-line"/></div>

      {/* Screener peers */}
      {peers.length > 0 ? (
        <div className="card" style={{overflowX:'auto',marginBottom:14}}>
          <div className="card-title">Peer Comparison (from Screener.in)</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead>
              <tr>{Object.keys(peers[0]).slice(0,6).map(h=><th key={h} style={{fontSize:8,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',textAlign:'left',padding:'7px 9px',borderBottom:'1px solid var(--b2)'}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              <tr style={{background:'var(--g3)',borderLeft:'2px solid var(--green)'}}>
                {Object.keys(peers[0]).slice(0,6).map(k=>{
                  const isName = k.toLowerCase().includes('company')||k.toLowerCase().includes('name')
                  return <td key={k} style={{padding:'8px 9px',fontWeight:isName?700:400,color:isName?'var(--green)':'var(--text)',borderBottom:'1px solid var(--b2)',fontSize:11}}>{isName?`${data.symbol} (Selected)`:data.ratios?.[k]||'—'}</td>
                })}
              </tr>
              {peers.map((p,i)=>(
                <tr key={i} style={{transition:'background 0.1s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--g3)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                  {Object.values(p).slice(0,6).map((v,j)=><td key={j} style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)',fontSize:11,fontWeight:j===0?600:400}}>{v||'—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{marginBottom:14,fontSize:11,color:'var(--muted)'}}>Peer data from Screener.in not available. Try running the CLI tool for more reliable peer data.</div>
      )}

      {/* Metric bars */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card-title">{data.symbol} — Key Metrics at a Glance</div>
        {metrics.map(m=>{
          if (!m.v) return null
          const n=parseFloat(m.v)||0
          const maxB=maxVals[m.l.toLowerCase().replace(' ','')] || 100
          const pct=Math.min(n/maxB*100,100)
          const col=m.higher?(n>15?'var(--green)':n>8?'var(--yellow)':'var(--red)'):(n<30?'var(--green)':n<60?'var(--yellow)':'var(--red)')
          return (
            <div key={m.l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
              <span style={{fontSize:9,color:'var(--muted)',width:90,flexShrink:0}}>{m.l}</span>
              <div style={{flex:1,height:8,background:'var(--bg4)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:col,borderRadius:4}}/>
              </div>
              <span style={{fontSize:10,color:'var(--text)',width:50,textAlign:'right'}}>{fN(m.v,'',''+m.unit,1)}</span>
            </div>
          )
        })}
      </div>

      {/* Live peer comparison */}
      <div className="card">
        <div className="card-title">Head-to-Head Live Comparison</div>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input className="input" style={{flex:1}} placeholder="Enter peer NSE ticker (e.g. BLUESTARCO)" value={peerTicker}
            onChange={e=>setPeerTicker(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==='Enter'&&analysePeer()}/>
          <button className="btn-primary" onClick={analysePeer} disabled={loading}>{loading?'…':'Analyse'}</button>
        </div>
        {peerData && (() => {
          const pr = peerData.ratios||{}
          const rows=[['P/E',r.pe,pr.pe,'lower'],['ROE %',r.roe,pr.roe,'higher'],['D/E',r.debt_to_equity,pr.debt_to_equity,'lower'],['Rev Growth %',r.revenue_growth,pr.revenue_growth,'higher'],['Net Margin %',r.profit_margin,pr.profit_margin,'higher'],['Op Margin %',r.op_margin,pr.op_margin,'higher'],['P/B',r.pb,pr.pb,'lower'],['Grade',data.fundamental?.grade,peerData.fundamental?.grade,'n']]
          return (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr>
                {['Metric',data.symbol,peerData.symbol,'Winner'].map(h=><th key={h} style={{fontSize:8,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',textAlign:'left',padding:'7px 9px',borderBottom:'1px solid var(--b2)'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map(([l,v1,v2,dir])=>{
                  const n1=parseFloat(v1)||0, n2=parseFloat(v2)||0
                  const win=dir==='higher'?(n1>n2?data.symbol:peerData.symbol):dir==='lower'?(n1<n2?data.symbol:peerData.symbol):'—'
                  const wc=win===data.symbol?'cg':win===peerData.symbol?'cy':'cd'
                  return (
                    <tr key={l} onMouseEnter={e=>e.currentTarget.style.background='var(--g3)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)',color:'var(--muted)'}}>{l}</td>
                      <td style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)'}}>{v1||'—'}</td>
                      <td style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)'}}>{v2||'—'}</td>
                      <td className={wc} style={{padding:'8px 9px',borderBottom:'1px solid var(--b2)',fontWeight:600}}>{win}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        })()}
      </div>
    </div>
  )
}
