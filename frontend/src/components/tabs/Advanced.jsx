import { fN } from '../../utils'
import { OPMChart, RelativeReturnChart, PEBandChart } from '../charts'

export default function Advanced({ data }) {
  if (!data) return <div className="empty-state"><div className="empty-icon">⊗</div><div className="empty-text">Select a stock first</div></div>

  const dp = data.dupont||{}; const wc = data.wcTrend||{}; const rr = data.relativeReturn||{}
  const rf = data.redFlags||[]; const ptx = data.promoterTx||[]; const cur = dp.current||{}

  const ptxMax = ptx.length ? Math.max(...ptx.map(t=>t.pct||0)) : 100

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}} className="advanced-layout">
        {/* Earnings History */}
        {(data.earningsHistory||[]).length > 0 && (
          <div style={{gridColumn: '1 / -1'}}>
            <div className="sec"><span className="sec-l">Earnings Beat/Miss History</span><div className="sec-line"/></div>
            <div className="card" style={{display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 15}}>
              {data.earningsHistory.map((e, i) => (
                <div key={i} style={{minWidth: 120, padding: 12, borderRadius: 6, background: e.surprise_pct > 0 ? 'rgba(34, 197, 94, 0.05)' : e.surprise_pct < 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-lighter)', border: `1px solid ${e.surprise_pct > 0 ? 'rgba(34, 197, 94, 0.2)' : e.surprise_pct < 0 ? 'rgba(239, 68, 68, 0.2)' : 'var(--border)'}`}}>
                  <div style={{fontSize: 10, color: 'var(--muted)', marginBottom: 5}}>{e.date}</div>
                  <div style={{fontSize: 14, fontWeight: 700, color: e.surprise_pct > 0 ? 'var(--green)' : e.surprise_pct < 0 ? 'var(--red)' : 'inherit', marginBottom: 2}}>
                    {e.surprise_pct > 0 ? '+' : ''}{e.surprise_pct}%
                  </div>
                  <div style={{fontSize: 9, color: 'var(--muted)'}}>Est: ₹{e.estimate}</div>
                  <div style={{fontSize: 9, color: 'var(--muted)'}}>Act: ₹{e.reported}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DuPont */}
        <div>
          <div className="sec"><span className="sec-l">DuPont Decomposition — ROE Analysis</span><div className="sec-line"/></div>
          <div className="g3">
            {[['Net Margin', `${cur.netMargin||'—'}%`, 'var(--green)', 'Profit / Revenue'],
              ['Asset Turnover', `${cur.assetTurnover||'—'}x`, 'var(--blue)', 'Revenue / Assets'],
              ['Equity Multiplier', `${cur.equityMultiplier||'—'}x`, 'var(--purple)', 'Assets / Equity']].map(([l,v,c,f])=>(
              <div key={l} className="card" style={{textAlign:'center'}}>
                <div style={{fontFamily:'var(--display)',fontSize:22,fontWeight:700,color:c}}>{v}</div>
                <div style={{fontSize:9,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',margin:'3px 0 2px'}}>{l}</div>
                <div style={{fontSize:9,color:'var(--dim)'}}>{f}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{marginBottom:10}}>
            {dp.insight && <div style={{fontSize:10,color:'var(--muted)',lineHeight:1.6,paddingBottom:10,borderBottom:'1px solid var(--b2)',marginBottom:10}}>{dp.insight}</div>}
            <div style={{display:'flex',gap:8,marginBottom:6,fontSize:9,color:'var(--muted)'}}>
              <span style={{width:40}}>Year</span>
              <span style={{flex:1}}>Net Margin</span>
              <span style={{flex:1}}>Asset T/O</span>
              <span style={{flex:1}}>Eq. Mult</span>
              <span style={{width:60,textAlign:'right'}}>ROE</span>
            </div>
            {(dp.trend||[]).map(t=>(
              <div key={t.year} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:9,color:'var(--muted)',width:40}}>{t.year}</span>
                <div style={{flex:1,height:4,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.min(t.netMargin/40*100,100).toFixed(0)}%`,background:'var(--green)',borderRadius:2}}/>
                </div>
                <span style={{fontSize:8,color:'var(--green)',width:36,textAlign:'right'}}>{t.netMargin}%</span>
                <div style={{flex:1,height:4,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.min(t.assetTurnover/3*100,100).toFixed(0)}%`,background:'var(--blue)',borderRadius:2}}/>
                </div>
                <span style={{fontSize:8,color:'var(--blue)',width:30,textAlign:'right'}}>{t.assetTurnover}x</span>
                <span style={{fontSize:9,fontWeight:700,color:t.roe>15?'var(--green)':'var(--yellow)',width:50,textAlign:'right'}}>ROE {t.roe}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Red flags */}
        <div>
          <div className="sec"><span className="sec-l">Annual Report Red Flags</span><div className="sec-line"/></div>
          {rf.map((f,i)=>{
            const cls=f.severity==='HIGH'?'rf-high':f.severity==='MEDIUM'?'rf-medium':'rf-clear'
            const col=f.severity==='HIGH'?'var(--red)':f.severity==='MEDIUM'?'var(--yellow)':'var(--green)'
            const icon=f.severity==='HIGH'?'⚠':f.severity==='MEDIUM'?'◈':'✓'
            return (
              <div key={i} className={`rf-card ${cls}`}>
                <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{icon}</span>
                <div style={{flex:1}}>
                  <div className="rf-flag" style={{color:col}}>{f.flag}</div>
                  <div className="rf-detail">{f.detail}</div>
                </div>
                <span className="tag" style={{color:col,borderColor:`${col}40`,background:`${col}12`,flexShrink:0}}>{f.severity}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Relative Return */}
      <div className="sec"><span className="sec-l">Relative Return vs Nifty 50</span><div className="sec-line"/></div>
      <div className="g4" style={{marginBottom:12}}>
        {Object.entries(rr.periods||{}).map(([period,d])=>{
          const alphaCol = d.alpha>0?'var(--green)':'var(--red)'
          return (
            <div key={period} className="card" style={{textAlign:'center'}}>
              <div style={{fontSize:9,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',marginBottom:4}}>{period}</div>
              <div style={{fontSize:15,fontWeight:700,color:d.stock>=0?'var(--green)':'var(--red)'}}>{d.stock!==null?(d.stock>=0?'+':'')+d.stock+'%':'—'}</div>
              <div style={{fontSize:9,color:'var(--muted)',marginTop:1}}>Nifty: {d.nifty!==null?(d.nifty>=0?'+':'')+d.nifty+'%':'—'}</div>
              {d.alpha!==null&&<div style={{fontSize:10,fontWeight:600,marginTop:4,padding:'2px 6px',borderRadius:3,background:`${alphaCol}12`,color:alphaCol}}>α {d.alpha>=0?'+':''}{d.alpha}%</div>}
            </div>
          )
        })}
      </div>
      {rr.insight && <div className="card" style={{fontSize:11,color:'var(--muted)',lineHeight:1.7,marginBottom:12}}>{rr.outperforming?'🟢':'🔴'} {rr.insight}</div>}
      {(rr.niftyHistory||[]).length > 0 && (
        <div className="chart-card" style={{marginBottom:14}}>
          <div className="chart-title">Stock vs Nifty 50 — Normalised (60D)</div>
          <RelativeReturnChart priceHistory={data.priceHistory||[]} niftyHistory={rr.niftyHistory||[]} symbol={data.symbol}/>
        </div>
      )}

      {/* PE Bands */}
      <div className="sec"><span className="sec-l">Historical P/E Band</span><div className="sec-line"/></div>
      <div className="chart-card" style={{marginBottom:14}}>
        <div className="chart-title">Price vs Mocked P/E Bands (Based on ±20% bands)</div>
        <PEBandChart data={data.priceHistory||[]} currentPE={data.ratios?.pe} />
      </div>

      {/* WC Trend */}
      <div className="sec"><span className="sec-l">Working Capital & Margin Trend</span><div className="sec-line"/></div>
      <div className="ch2">
        <div className="card">
          <div className="card-title">Quarterly Operating Performance</div>
          {(wc.trend||[]).length ? (
            <table className="stbl">
              <thead><tr>
                {['Quarter','Revenue Cr','QoQ Gr%','OPM%','PAT Cr'].map(h=><th key={h} className="tl" style={{color:'var(--muted)',fontSize:9}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {(wc.trend||[]).map((q,i)=>(
                  <tr key={i}>
                    <td className="tl">{q.quarter||''}</td>
                    <td className="tm">{fN(q.revenue,'₹',' Cr',0)}</td>
                    <td className={`tm ${(q.revenueGrowthQoQ||0)>=0?'cg':'cr'}`}>{q.revenueGrowthQoQ!=null?(q.revenueGrowthQoQ>=0?'+':'')+q.revenueGrowthQoQ+'%':'—'}</td>
                    <td className={`tm ${q.opm>15?'cg':q.opm>8?'cy':'cr'}`}>{fN(q.opm,'','%',1)}</td>
                    <td className="tm cg">{fN(q.pat,'₹',' Cr',1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={{fontSize:10,color:'var(--muted)'}}>No quarterly data</div>}
          {wc.insight && <div style={{marginTop:10,fontSize:10,color:'var(--muted)',lineHeight:1.6,borderTop:'1px solid var(--b2)',paddingTop:8}}>{wc.insight}</div>}
        </div>
        <div className="chart-card">
          <div className="chart-title">OPM% Trend</div>
          <OPMChart data={wc.trend||[]}/>
        </div>
      </div>

      {/* Promoter history */}
      <div className="sec"><span className="sec-l">Promoter Holding History</span><div className="sec-line"/></div>
      <div className="ch2">
        <div className="card">
          {(ptx||[]).length ? ptx.slice(0,10).map((t,i)=>{
            const prev=ptx[i+1]; const chg=prev?(t.pct-prev.pct).toFixed(1):null
            const cc=chg===null?'cd':chg>0?'cg':chg<0?'cr':'cd'
            return (
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:9,color:'var(--muted)',width:70,flexShrink:0}}>{t.quarter||''}</span>
                <div style={{flex:1,height:6,background:'var(--bg4)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:ptxMax?`${(t.pct/ptxMax*100).toFixed(0)}%`:'0%',background:'var(--green)',borderRadius:3}}/>
                </div>
                <span className="cg" style={{fontSize:10,fontWeight:600,width:40,textAlign:'right'}}>{t.pct}%</span>
                <span className={cc} style={{fontSize:9,width:36,textAlign:'right'}}>{chg!==null?(chg>=0?'+':'')+chg+'pp':''}</span>
              </div>
            )
          }) : <div style={{fontSize:10,color:'var(--muted)'}}>Promoter data unavailable. Run the CLI tool for more reliable data.</div>}
        </div>
        <div className="card">
          <div className="card-title">Interpretation</div>
          <div style={{fontSize:10,color:'var(--muted)',lineHeight:1.9}}>
            <div style={{marginBottom:6}}><span className="cg">↑ Increasing</span> — Promoter buying. Very bullish. Shows founder conviction.</div>
            <div style={{marginBottom:6}}><span className="cy">→ Stable</span> — No change. Neutral signal.</div>
            <div style={{marginBottom:10}}><span className="cr">↓ Decreasing</span> — Promoter selling. Strong red flag. Always investigate.</div>
            <div style={{borderTop:'1px solid var(--b2)',paddingTop:8}}>RJ: "The biggest risk is not understanding the business." A promoter who doesn't believe in their own business sells.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
