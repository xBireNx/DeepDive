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
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14, height: 'calc(100dvh - 180px)' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Stocks</span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {allTickers.map(t => (
            <div
              key={t}
              onClick={() => setActiveTicker(t)}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                background: activeTicker === t ? 'var(--accent-primary-dim)' : 'transparent',
                borderLeft: activeTicker === t ? '3px solid var(--accent-primary)' : '3px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{t}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {notes[t] ? notes[t].substring(0, 30) + '…' : 'No notes'}
              </div>
              {notes[t] && <div style={{ fontSize: 9, color: 'var(--gain)', marginTop: 3 }}>Saved ✓</div>}
            </div>
          ))}
          {allTickers.length === 0 && (
            <div style={{ padding: 16, fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>No stocks yet</div>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'var(--bg-tertiary)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-primary-dim)', padding: '3px 10px', borderRadius: 'var(--radius-sm)' }}>
            {activeTicker || '—'}
          </span>
          <div style={{ display: 'flex', gap: 3 }}>
            {['## ', '• ', '**', '→ ', '⚠ ', '✓ '].map(fmt => (
              <button
                key={fmt}
                onClick={() => insertFmt(fmt)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  padding: '3px 6px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {fmt.trim() || '•'}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 10, color: dirty ? 'var(--warning)' : 'var(--gain)', marginLeft: 'auto' }}>
            {dirty ? 'Unsaved changes *' : 'All saved'}
          </span>
          <button className="btn-primary" onClick={save} style={{ fontSize: 11, padding: '6px 12px' }}>Save</button>
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
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            padding: 14,
            resize: 'none',
            outline: 'none',
            lineHeight: 1.8
          }}
        />
      </div>
    </div>
  )
}