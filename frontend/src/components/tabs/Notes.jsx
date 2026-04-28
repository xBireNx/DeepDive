import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { showToast } from '../Toast'

export default function Notes({ data }) {
  const { notes, setNote, watchlist, portfolio, stockCache } = useStore()
  const allTickers = [...new Set([...watchlist, ...portfolio.map(h => h.ticker)])]
  const [activeTicker, setActiveTicker] = useState(data?.symbol || allTickers[0] || '')
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (activeTicker) { setContent(notes[activeTicker] || ''); setDirty(false) }
  }, [activeTicker, notes])

  const save = () => {
    setNote(activeTicker, content)
    setDirty(false)
    showToast(`Notes saved for ${activeTicker}`)
  }

  const insertFmt = (fmt) => {
    const ta = document.getElementById('notesTA')
    if (!ta) return
    const s = ta.selectionStart
    const newVal = content.substring(0, s) + fmt + content.substring(ta.selectionEnd)
    setContent(newVal)
    setDirty(true)
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + fmt.length; ta.focus() }, 0)
  }

  const sd = stockCache[activeTicker]
  const placeholder = `Investment Thesis — ${activeTicker || 'Select a stock'}

Why I'm watching:
•

Key catalysts:
•

Risks:
•

Buy condition:
•

Exit condition:

Grade: ${sd?.fundamental?.grade || '?'} · PE: ${sd?.ratios?.pe || '?'}x · ROE: ${sd?.ratios?.roe || '?'}%`

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, height: 'calc(100dvh - 180px)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-elevated)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Stocks</span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {allTickers.map(t => (
            <div
              key={t}
              onClick={() => setActiveTicker(t)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: activeTicker === t ? 'var(--primary-glow)' : 'transparent',
                borderLeft: activeTicker === t ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {notes[t] ? notes[t].substring(0, 30) + '…' : 'No notes'}
              </div>
              {notes[t] && <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 4 }}>Saved ✓</div>}
            </div>
          ))}
          {allTickers.length === 0 && (
            <div style={{ padding: 20, fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>No stocks yet</div>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'var(--surface-elevated)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '4px 12px', borderRadius: 'var(--radius-xs)' }}>
            {activeTicker || '—'}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['## ', '• ', '**', '→ ', '⚠ ', '✓ '].map(fmt => (
              <button
                key={fmt}
                onClick={() => insertFmt(fmt)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {fmt.trim() || '•'}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: dirty ? 'var(--warning)' : 'var(--success)', marginLeft: 'auto' }}>
            {dirty ? 'Unsaved changes *' : 'All changes saved'}
          </span>
          <button className="btn-primary" onClick={save} style={{ fontSize: 12, padding: '8px 16px' }}>Save</button>
        </div>
        <textarea
          id="notesTA"
          value={content}
          onChange={e => { setContent(e.target.value); setDirty(true) }}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            padding: 16,
            resize: 'none',
            outline: 'none',
            lineHeight: 1.8
          }}
        />
      </div>
    </div>
  )
}