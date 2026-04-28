import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { sentClass } from '../../utils'
import { showToast } from '../Toast'

const sentBadge = (label='') => {
  const m={'Very Positive':'tag-g','Positive':'tag-g','Negative':'tag-r','Very Negative':'tag-r'}
  return m[label]||'tag-m'
}
const sentColor = s => s>=1?'var(--green)':s>0?'var(--green2)':s<=-1?'var(--red)':s<0?'#ff8844':'var(--muted)'

export default function News({ data }) {
  const { fetchNews, newsCache, clearNewsCache } = useStore()
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async (force=false) => {
    if (!data) return
    if (force) clearNewsCache(data.symbol)
    if (!force && newsCache[data.symbol]) { setNews(newsCache[data.symbol]); return }
    setLoading(true)
    try {
      const n = await fetchNews(data.symbol)
      setNews(n)
    } catch(e) { showToast('⚠ News unavailable', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (data) load() }, [data?.symbol])

  if (!data) return <div className="empty-state"><div className="empty-icon">◉</div><div className="empty-text">Select a stock first</div></div>
  if (loading) return <div className="loading-state"><div className="spinner"/><div className="loading-text">Fetching news & sentiment…</div></div>

  const sent = news?.sentiment || {}
  const arts = news?.articles || []
  const sentScore = ((sent.score||0)+2)/4*100
  const col = sentColor(sent.score||0)

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:14}} className="news-layout">
      {/* Articles */}
      <div>
        <div className="sec">
          <span className="sec-l">{data.symbol} — News & Sentiment</span>
          <div className="sec-line"/>
          <button className="btn-outline" onClick={()=>load(true)}>↻ Refresh</button>
        </div>
        {arts.length === 0 && <div className="empty-state" style={{height:200}}><div className="empty-icon">◉</div><div className="empty-text">No news found</div></div>}
        {arts.map((a,i) => {
          const s = a.sentiment||{}
          return (
            <div key={i} className={`news-article ${sentClass(s.label)}`}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:5,flexWrap:'wrap'}}>
                <span style={{fontSize:9,color:'var(--muted)'}}>{a.source||'News'}</span>
                <span style={{fontSize:9,color:'var(--dim)'}}>{a.published||''}</span>
                <span className={`tag ${sentBadge(s.label)}`}>{s.label||'Neutral'}</span>
              </div>
              <div className="news-title">
                {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a> : a.title}
              </div>
              {a.summary && <div style={{fontSize:10,color:'var(--muted)',lineHeight:1.6,marginTop:4}}>{a.summary}</div>}
              <div style={{display:'flex',gap:4,marginTop:6,flexWrap:'wrap'}}>
                {(s.posKeywords||[]).map(k=><span key={k} style={{fontSize:8,background:'rgba(0,255,136,0.07)',color:'var(--green)',border:'1px solid rgba(0,255,136,0.15)',padding:'1px 5px',borderRadius:2}}>↑ {k}</span>)}
                {(s.negKeywords||[]).map(k=><span key={k} style={{fontSize:8,background:'rgba(255,69,96,0.07)',color:'var(--red)',border:'1px solid rgba(255,69,96,0.15)',padding:'1px 5px',borderRadius:2}}>↓ {k}</span>)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sentiment summary */}
      <div>
        <div className="card" style={{marginBottom:10}}>
          <div className="card-title">Sentiment Summary</div>
          <div style={{fontFamily:'var(--display)',fontSize:22,fontWeight:700,color:col,marginBottom:4}}>{sent.overall||'Neutral'}</div>
          <div style={{height:8,background:'var(--bg4)',borderRadius:4,overflow:'hidden',margin:'8px 0 4px'}}>
            <div style={{height:'100%',width:`${sentScore.toFixed(0)}%`,background:col,borderRadius:4,transition:'width 0.6s'}}/>
          </div>
          <div style={{fontSize:9,color:'var(--muted)',marginBottom:10}}>Score: {(sent.score||0).toFixed(2)} (−2 very neg → +2 very pos)</div>
          {[['Positive',sent.positive||0,'var(--green)'],['Neutral',sent.neutral||0,'var(--muted)'],['Negative',sent.negative||0,'var(--red)']].map(([l,v,c])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:9,color:'var(--muted)',width:60}}>{l}</span>
              <div style={{flex:1,height:4,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:sent.total?`${(v/sent.total*100).toFixed(0)}%`:'0%',background:c,borderRadius:2}}/>
              </div>
              <span style={{fontSize:9,color:'var(--text)',width:16,textAlign:'right'}}>{v}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">Sentiment Guide</div>
          <div style={{fontSize:10,color:'var(--muted)',lineHeight:1.9}}>
            {[['Very Positive','var(--green)','Record results, major orders, upgrades'],['Positive','var(--green2)','Good earnings, growth news'],['Neutral','var(--muted)','Routine announcements'],['Negative','var(--red)','Misses, delays, concerns'],['Very Negative','var(--red)','SEBI notice, fraud, raids']].map(([l,c,d])=>(
              <div key={l} style={{marginBottom:5}}><span style={{color:c}}>● {l}</span> — {d}</div>
            ))}
          </div>
        </div>
        <div className="card" style={{marginTop:10}}>
          <div className="card-title">AI Note</div>
          <div style={{fontSize:10,color:'var(--muted)',lineHeight:1.7}}>Keyword-based scoring. Always read full articles — context matters. "SEBI approval" is positive, "SEBI notice" is negative.</div>
        </div>
      </div>
    </div>
  )
}
