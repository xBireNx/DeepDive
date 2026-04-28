import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { showToast } from '../Toast'

export default function Notes({ data }) {
  const { notes, setNote, watchlist, portfolio, stockCache } = useStore()
  const allTickers = [...new Set([...watchlist,...portfolio.map(h=>h.ticker)])]
  const [activeTicker, setActiveTicker] = useState(data?.symbol || allTickers[0] || '')
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (activeTicker) { setContent(notes[activeTicker]||''); setDirty(false) }
  }, [activeTicker])

  const save = () => {
    setNote(activeTicker, content)
    setDirty(false)
    showToast(`✓ Notes saved for ${activeTicker}`)
  }

  const insertFmt = (fmt) => {
    const ta=document.getElementById('notesTA'); if(!ta)return
    const s=ta.selectionStart
    const newVal=content.substring(0,s)+fmt+content.substring(ta.selectionEnd)
    setContent(newVal); setDirty(true)
    setTimeout(()=>{ta.selectionStart=ta.selectionEnd=s+fmt.length;ta.focus()},0)
  }

  const sd = stockCache[activeTicker]
  const placeholder = `Investment Thesis — ${activeTicker||'Select a stock'}\n\nWhy I'm watching:\n• \n\nKey catalysts:\n• \n\nRisks:\n• \n\nBuy condition:\n• \n\nExit condition:\n• \n\nGrade: ${sd?.fundamental?.grade||'?'} · PE: ${sd?.ratios?.pe||'?'}x · ROE: ${sd?.ratios?.roe||'?'}%`

  return (
    <div style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:14,height:'calc(100dvh - 148px)'}} className="notes-layout">
      {/* Stock list */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:'var(--r)',overflowY:'auto'}}>
        {allTickers.map(t=>(
          <div key={t} onClick={()=>setActiveTicker(t)}
            style={{padding:'9px 11px',borderBottom:'1px solid var(--b2)',cursor:'pointer',background:activeTicker===t?'var(--g3)':'transparent',borderLeft:activeTicker===t?'2px solid var(--green)':'none',paddingLeft:activeTicker===t?9:11,transition:'background 0.15s'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#fff'}}>{t}</div>
            <div style={{fontSize:9,color:'var(--muted)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{notes[t]?notes[t].substring(0,30)+'…':'No notes'}</div>
            {notes[t]&&<div style={{fontSize:8,color:'var(--dim)',marginTop:1}}>saved ✓</div>}
          </div>
        ))}
        {allTickers.length===0&&<div style={{padding:16,fontSize:10,color:'var(--muted)',textAlign:'center'}}>No stocks yet</div>}
      </div>

      {/* Editor */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:'var(--r)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'9px 12px',borderBottom:'1px solid var(--b2)',display:'flex',alignItems:'center',gap:7,flexShrink:0,flexWrap:'wrap'}}>
          <span style={{fontSize:10,fontWeight:700,color:'var(--green)',background:'var(--g3)',border:'1px solid rgba(0,255,136,0.2)',padding:'2px 9px',borderRadius:3}}>{activeTicker||'—'}</span>
          <div style={{display:'flex',gap:3}}>
            {['## ','• ','**','→ ','⚠ ','✓ ','❌ '].map(fmt=>(
              <button key={fmt} onClick={()=>insertFmt(fmt)}
                style={{background:'transparent',border:'1px solid var(--b2)',color:'var(--muted)',fontFamily:'var(--mono)',fontSize:10,padding:'3px 7px',borderRadius:3,cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--green)';e.currentTarget.style.color='var(--green)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b2)';e.currentTarget.style.color='var(--muted)'}}>
                {fmt.trim()||'•'}
              </button>
            ))}
          </div>
          <span style={{fontSize:9,color:'var(--muted)',marginLeft:6}}>{dirty?'Unsaved *':'All changes saved'}</span>
          <button className="btn-primary" style={{marginLeft:'auto',fontSize:9,padding:'4px 13px'}} onClick={save}>Save</button>
        </div>
        <textarea id="notesTA"
          value={content}
          onChange={e=>{setContent(e.target.value);setDirty(true)}}
          placeholder={placeholder}
          style={{flex:1,background:'transparent',border:'none',color:'var(--text)',fontFamily:'var(--mono)',fontSize:12,padding:14,resize:'none',outline:'none',lineHeight:1.8}}
        />
      </div>
    </div>
  )
}
