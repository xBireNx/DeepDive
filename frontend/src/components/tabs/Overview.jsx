import { fN, fCr, gradeColor, vc, scoreColor } from '../../utils'
import { PriceChart, QuarterlyChart, DonutChart, ScoreRadar } from '../charts'
import { useStore } from '../../store'

const SecHeader = ({ label, children }) => (
  <div className="sec">
    <span className="sec-l">{label}</span>
    <div className="sec-line" />
    {children}
  </div>
)

function ScoreCard({ card }) {
  const bc = scoreColor(card.score, card.max_score)
  return (
    <div className="card" style={{ marginBottom: 8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
        <span style={{ fontSize:12, fontWeight:600, color:'#fff', flex:1 }}>{card.category}</span>
        <div className="score-bar-o" style={{ width:80 }}>
          <div className="score-bar-i" style={{ width:`${card.score/card.max_score*100}%`, background:bc }}/>
        </div>
        <span style={{ fontSize:9, color:'var(--muted)' }}>{card.score}/{card.max_score}</span>
      </div>
      {card.narrative && <p style={{ fontSize:10, color:'var(--muted)', lineHeight:1.6, marginBottom:8 }}>{card.narrative}</p>}
      <table className="stbl"><tbody>
        {(card.signals||[]).map(([n,v,vr], i) => (
          <tr key={i}><td className="tl">{n}</td><td className="tm">{v}</td><td className={`tr ${vc(vr)}`}>{vr}</td></tr>
        ))}
      </tbody></table>
    </div>
  )
}

export default function Overview({ data }) {
  // setActiveTab placeholder (not needed in this scope). The store currently uses activeStock management elsewhere.

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">◈</div>
      <div className="empty-text">Select a stock to analyse</div>
      <div className="empty-hint">Type a ticker and click ▶ Analyse</div>
    </div>
  )

  const { company, price, ratios, fundamental, technical, shareholding, quarterly, aceInvestors, promoterHistory, priceHistory, dividends, mfChanges } = data
  const r = ratios || {}
  const f = fundamental || {}
  const t = technical || {}
  const isPos = (price?.ret1m || 0) >= 0
  const cc = isPos ? 'var(--green)' : 'var(--red)'
  const rp = ((((price?.current||0)-(price?.week52Low||0))/((price?.week52High||1)-(price?.week52Low||0)))*100).toFixed(1)
  const beneishColor = f.beneish?.score < -2.22 ? 'var(--green)' : f.beneish?.score < -1.78 ? 'var(--yellow)' : 'var(--red)'
  const altmanColor  = f.altman?.score > 2.99 ? 'var(--green)' : f.altman?.score > 1.81 ? 'var(--yellow)' : 'var(--red)'
  const trendCol = t.longPct >= 60 ? 'var(--green)' : t.longPct <= 40 ? 'var(--red)' : 'var(--yellow)'

  const statCards = [
    ['P/E', fN(r.pe,'','x',1), r.pe>60?'y':r.pe<20?'g':''],
    ['ROE', fN(r.roe,'','%',1), r.roe>15?'g':r.roe>10?'y':'r'],
    ['D/E', fN(r.debt_to_equity,'','x',2), r.debt_to_equity<0.3?'g':r.debt_to_equity<1?'y':'r'],
    ['Net Margin', fN(r.profit_margin,'','%',1), r.profit_margin>10?'g':r.profit_margin>5?'y':'r'],
    ['Rev Growth', fN(r.revenue_growth,'','%',1), r.revenue_growth>20?'g':r.revenue_growth>10?'y':'r'],
    ['Op Margin', fN(r.op_margin,'','%',1), r.op_margin>15?'g':r.op_margin>8?'y':'r'],
    ['P/B', fN(r.pb,'','x',1), r.pb<3?'g':r.pb<7?'y':'r'],
    ['EV/EBITDA', fN(r.ev_ebitda,'','x',1), r.ev_ebitda<15?'g':r.ev_ebitda<25?'y':'r'],
  ]

  return (
    <div>
      {/* Hero */}
      <div className="hero-grid">
        <div>
          <div className="hero-ticker">{data.symbol}</div>
          <div className="hero-name">{company?.name}</div>
          <div className="hero-meta">{company?.sector} • {company?.industry} • MCap {fCr(company?.market_cap_cr)}</div>
        </div>
        <div>
          <div className="hero-price">₹{(price?.current||0).toLocaleString('en-IN',{maximumFractionDigits:2})}</div>
          <div className="hero-change" style={{color:cc}}>
            {isPos?'↑':'↓'} {(price?.ret1m||0).toFixed(2)}% (1M)
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="g4">
        {statCards.map(([l,v,c]) => (
          <div key={l} className="stat-card">
            <div className="stat-label">{l}</div>
            <div className={`stat-value ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <SecHeader label="Analysis Overview"/>
      <div className="ch3">
        <div className="chart-card">
          <div className="chart-title">Price Trend (60D)</div>
          <div style={{ height: 200 }}><PriceChart data={priceHistory||[]}/></div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Quarterly Performance</div>
          <div style={{ height: 200 }}><QuarterlyChart data={quarterly||[]}/></div>
        </div>
        <div className="chart-card" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
          <div className="chart-title" style={{alignSelf:'flex-start'}}>Shareholding</div>
          <div style={{ height: 200, width: '100%' }}><DonutChart data={shareholding||{}}/></div>
        </div>
      </div>

      {/* Description */}
      {company?.description && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Business Description</div>
          <p style={{fontSize:14, color:'var(--text-muted)', lineHeight:1.7}}>{company.description}</p>
        </div>
      )}

      {/* 52W Range */}
      <div className="card" style={{marginBottom:24}}>
        <div className="card-title">52-Week Range Performance</div>
        <div className="rb-o"><div className="rb-f" style={{width:`${rp}%`, background: 'var(--primary)'}}/></div>
        <div className="rb-labels">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>LOW</span>
            <span style={{ fontWeight: 600 }}>₹{price?.week52Low||'—'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--primary)' }}>CURRENT</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{rp}%</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>HIGH</span>
            <span style={{ fontWeight: 600 }}>₹{price?.week52High||'—'}</span>
          </div>
        </div>
      </div>

      {/* Fundamental */}
      <SecHeader label="Buffett & RJ Analysis">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,color:gradeColor(f.grade)}}>{f.grade||'?'}</div>
          <div style={{fontSize:12, fontWeight: 600, color:'var(--text-muted)'}}>{f.overallPct||0}% Score</div>
        </div>
      </SecHeader>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:20,marginBottom:24}}>
        <div className="card" style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>
          <div className="card-title">Score Breakdown</div>
          <ScoreRadar scorecards={f.scorecards||[]}/>
        </div>
        <div className="card" style={{display:'flex',flexDirection:'column',justifyContent:'center',gap:12}}>
          {(f.scorecards||[]).map(c => (
            <div key={c.category} className="score-row">
              <span className="score-name" style={{ width: 140, fontSize: 12 }}>{c.category}</span>
              <div className="score-bar-o" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="score-bar-i" style={{width:`${c.score/c.max_score*100}%`,background:scoreColor(c.score,c.max_score)}}/>
              </div>
              <span className="score-num" style={{ width: 40, fontSize: 11, fontWeight: 600 }}>{c.score}/{c.max_score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="g2">
        {(f.scorecards||[]).map(card => <ScoreCard key={card.category} card={card}/>)}
      </div>

      {/* Anomaly */}
      <SecHeader label="Financial Integrity & Risk"/>
      <div className="g2">
        <div className="card" style={{display:'flex',alignItems:'center',gap:20}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:32,fontWeight:800,color:beneishColor}}>{(f.beneish?.score||0).toFixed(2)}</div>
          <div>
            <div style={{fontSize:12,color:'var(--text-dim)',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>Beneish M-Score</div>
            <div style={{fontSize:13,color:'var(--text-muted)'}}>{f.beneish?.verdict||'Not available'}</div>
          </div>
        </div>
        <div className="card" style={{display:'flex',alignItems:'center',gap:20}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:32,fontWeight:800,color:altmanColor}}>{(f.altman?.score||0).toFixed(1)}</div>
          <div>
            <div style={{fontSize:12,color:'var(--text-dim)',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>Altman Z-Score</div>
            <div style={{fontSize:13,color:'var(--text-muted)'}}>{f.altman?.verdict||'Not available'}</div>
          </div>
        </div>
      </div>

      {/* Technical */}
      <SecHeader label="Technical Market Stance"/>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{display:'flex',alignItems:'center',gap:32,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11,color:'var(--text-dim)',fontWeight:700,textTransform:'uppercase'}}>Market Trend</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,color:trendCol, marginTop: 4}}>{t.trend||'—'}</div>
          </div>
          <div style={{flex:1,minWidth:200}}>
            <div style={{display:'flex',justifyContent: 'space-between', fontSize:11, fontWeight: 700, color:'var(--text-dim)',marginBottom:6}}>
              <span>LONG {t.longPct||50}%</span><span>SHORT {100-(t.longPct||50)}%</span>
            </div>
            <div style={{height:8,background:'rgba(255,255,255,0.05)',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${t.longPct||50}%`,background:'var(--primary)',borderRadius:4}}/>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['RSI',t.rsiVal],['MACD',t.macdVerdict],['ADX',t.adxVal]].map(([k,v])=>(
              <div key={k}>
                <div style={{fontSize:11,color:'var(--text-dim)', fontWeight: 700}}>{k}</div>
                <div style={{fontSize:16,fontWeight:700,color:'#fff', marginTop: 2}}>{v||'—'}</div>
              </div>
            ))}
          </div>
        </div>
        {t.narrative && <div style={{fontSize:14,color:'var(--text-muted)',lineHeight:1.7,marginTop:20, paddingTop: 20, borderTop: '1px solid var(--border)'}}>{t.narrative}</div>}
      </div>

      <div className="ch2">
        <div className="card">
          <div className="card-title">Market Signals</div>
          <table className="stbl"><tbody>
            {(t.signals||[]).map(([n,v,vr,cl],i)=>(
              <tr key={i}><td className="tl">{n}</td><td className="tm">{v}</td><td className={`tr ${cl||vc(vr)}`}>{vr}</td></tr>
            ))}
          </tbody></table>
        </div>
        <div className="card">
          <div className="card-title">Support & Resistance</div>
          <table className="stbl"><tbody>
            <tr><td className="tl">Support (50D)</td><td className="tm">₹{t.supportResistance?.support_50d||'—'}</td><td className="tr" style={{color:'var(--success)'}}>Floor</td></tr>
            <tr><td className="tl">Resistance (50D)</td><td className="tm">₹{t.supportResistance?.resistance_50d||'—'}</td><td className="tr" style={{color:'var(--text-dim)'}}>Ceiling</td></tr>
            <tr><td className="tl">Volume vs Avg</td><td className="tm">{t.volumeAnalysis?.ratio||'—'}x</td><td className={`tr ${vc(t.volumeAnalysis?.verdict||'')}`}>{t.volumeAnalysis?.verdict||'—'}</td></tr>
          </tbody></table>
        </div>
      </div>

      {/* Ownership */}
      <SecHeader label="Ownership & Quarterly History"/>
      <div className="ch2">
        <div className="card">
          <div className="card-title">Shareholding Distribution</div>
          <table className="stbl"><tbody>
            {Object.entries(shareholding||{}).map(([k,v])=>(
              <tr key={k}><td className="tl">{k.charAt(0).toUpperCase()+k.slice(1)}</td><td className="tm">{v}%</td><td className="tr" style={{color:k==='promoter'?'var(--success)':'var(--text-dim)'}}>•</td></tr>
            ))}
          </tbody></table>
          {(promoterHistory||[]).length >= 2 && (
            <div style={{marginTop:16,fontSize:12,color:'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6}}>
              <span>Promoter Trend:</span>
              <span style={{fontWeight: 700, color:promoterHistory[0]?.pct>promoterHistory[promoterHistory.length-1]?.pct?'var(--success)':'var(--error)'}}>
                {promoterHistory[0]?.pct>promoterHistory[promoterHistory.length-1]?.pct?'Increasing ↑':'Decreasing ↓'}
              </span>
            </div>
          )}
          {(aceInvestors||[]).length > 0 && (
            <div style={{marginTop:16, display: 'flex', flexWrap: 'wrap', gap: 6}}>
              {aceInvestors.map(a=><span key={a} style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{a}</span>)}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-title">Quarterly Trends</div>
          <table className="stbl">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th className="tl" style={{fontSize:11}}>QUARTER</th>
                <th className="tm" style={{fontSize:11}}>REVENUE</th>
                <th className="tm" style={{fontSize:11}}>NET PROFIT</th>
                <th className="tr" style={{fontSize:11}}>OPM%</th>
              </tr>
            </thead>
            <tbody>
              {[...(quarterly||[])].reverse().slice(0, 5).map((q,i)=>(
                <tr key={i}>
                  <td className="tl" style={{ fontWeight: 600 }}>{q.quarter||''}</td>
                  <td className="tm">{fN(q.revenue,'₹',' Cr',0)}</td>
                  <td className="tm" style={{color:'var(--success)'}}>{fN(q.net_profit,'₹',' Cr',1)}</td>
                  <td className="tr">{fN(q.opm,'','%',1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        {dividends?.has_dividends && (
          <div className="card">
            <div className="card-title">Dividend Consistency (Buffett Indicator)</div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
              <div><div style={{fontSize:9, color:'var(--muted)'}}>Frequency</div><div style={{fontSize:14, fontWeight:600}}>{dividends.payout_frequency}</div></div>
              <div><div style={{fontSize:9, color:'var(--muted)'}}>5Y Avg Payout</div><div style={{fontSize:14, fontWeight:600}}>₹{dividends.avg_payout_5y}</div></div>
              <div><div style={{fontSize:9, color:'var(--muted)'}}>Yield</div><div style={{fontSize:14, fontWeight:600, color: 'var(--green)'}}>{(r.dividend_yield * 100).toFixed(2)}%</div></div>
            </div>
            <table className="stbl">
              <thead><tr><th className="tl">Date</th><th className="tr">Amount</th></tr></thead>
              <tbody>
                {(dividends.track_record || []).slice(0, 5).map((d, i) => (
                  <tr key={i}>
                    <td className="tl" style={{color: 'var(--muted)'}}>{d.date}</td>
                    <td className="tr cg">₹{d.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  )
}
