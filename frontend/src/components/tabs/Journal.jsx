import { useState } from 'react'
import { useStore } from '../../store'
import { showToast } from '../Toast'

const EMOTIONS = ['', 'Confident', 'FOMO', 'Fearful', 'Greedy', 'Patient', 'Disciplined']

export default function Journal() {
  const { journal, addJournalEntry, removeJournalEntry, watchlist, portfolio } = useStore()
  const allTickers = [...new Set([...watchlist, ...portfolio.map(h => h.ticker)])]
  const [form, setForm] = useState({ ticker: '', action: 'BUY', price: '', qty: '', date: new Date().toISOString().split('T')[0], emotion: '', target: '', sl: '', thesis: '' })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const doAdd = () => {
    if (!form.ticker) { showToast('Select a stock', 'error'); return }
    addJournalEntry({ ...form, ts: Date.now() })
    setForm({ ticker: '', action: 'BUY', price: '', qty: '', date: new Date().toISOString().split('T')[0], emotion: '', target: '', sl: '', thesis: '' })
    showToast('Entry logged')
  }

  const buys = journal.filter(j => j.action === 'BUY').length
  const sells = journal.filter(j => j.action === 'SELL').length
  const emotions = EMOTIONS.slice(1)
  const emotionCounts = {}
  emotions.forEach(e => { emotionCounts[e] = journal.filter(j => j.emotion === e).length })
  const goodEmotions = ['Disciplined', 'Patient', 'Confident']

  return (
    <div className="layout-2col">
      <div>
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-title" style={{ marginBottom: 12 }}>Log Trade / Observation</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <select className="select" value={form.ticker} onChange={e => f('ticker', e.target.value)}>
              <option value="">Select Stock</option>
              {allTickers.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="select" value={form.action} onChange={e => f('action', e.target.value)}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
              <option value="WATCH">WATCH</option>
            </select>
            <input className="input" type="number" placeholder="Price ₹" value={form.price} onChange={e => f('price', e.target.value)} style={{ fontSize: 12 }} />
            <input className="input" type="number" placeholder="Qty" value={form.qty} onChange={e => f('qty', e.target.value)} style={{ fontSize: 12 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input className="input" type="date" value={form.date} onChange={e => f('date', e.target.value)} style={{ fontSize: 11 }} />
            <select className="select" value={form.emotion} onChange={e => f('emotion', e.target.value)}>
              {EMOTIONS.map(e => <option key={e} value={e}>{e || 'Emotion?'}</option>)}
            </select>
            <input className="input" type="number" placeholder="Target ₹" value={form.target} onChange={e => f('target', e.target.value)} style={{ fontSize: 12 }} />
            <input className="input" type="number" placeholder="Stop-Loss ₹" value={form.sl} onChange={e => f('sl', e.target.value)} style={{ fontSize: 12 }} />
          </div>
          <textarea
            className="input"
            style={{ height: 70, resize: 'vertical' }}
            placeholder="Investment thesis — Why? What catalyst? What breaks the thesis?"
            value={form.thesis}
            onChange={e => f('thesis', e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button className="btn-primary" onClick={doAdd} style={{ fontSize: 12, padding: '8px 16px' }}>+ Log Entry</button>
          </div>
        </div>

        {journal.length === 0 && (
          <div className="empty-state" style={{ minHeight: 140 }}>
            <div className="empty-icon">◩</div>
            <div className="empty-title">No entries yet</div>
          </div>
        )}

        {journal.map((j, i) => (
          <div key={i} className="journal-entry">
            <button
              className="btn-sm-red"
              style={{ position: 'absolute', right: 10, top: 10 }}
              onClick={() => { removeJournalEntry(i); showToast('Entry deleted') }}
            >
              ✕
            </button>
            <div className="j-header">
              <span className="j-ticker">{j.ticker}</span>
              <span className={`j-action ${j.action.toLowerCase()}`}>{j.action}</span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{j.date}</span>
              {j.emotion && <span style={{ fontSize: 10, color: 'var(--warning)' }}>{j.emotion}</span>}
            </div>
            <div className="j-content">{j.thesis || 'No thesis recorded.'}</div>
            <div className="j-meta">
              {j.price && <span>Price <strong>₹{j.price}</strong></span>}
              {j.qty && <span>Qty <strong>{j.qty}</strong></span>}
              {j.target && <span style={{ color: 'var(--gain)' }}>Target ₹{j.target}</span>}
              {j.sl && <span style={{ color: 'var(--loss)' }}>SL ₹{j.sl}</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="panel" style={{ padding: '16px' }}>
          <div className="panel-title">Stats</div>
          {[
            ['Total', journal.length, ''],
            ['Buys', buys, 'text-gain'],
            ['Sells', sells, 'text-loss'],
            ['Stocks', [...new Set(journal.map(j => j.ticker))].length, '']
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
              <span className={c} style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>

        <div className="panel" style={{ padding: '16px' }}>
          <div className="panel-title">Behavioral Tracker</div>
          {emotions.map(e => {
            const n = emotionCounts[e] || 0
            const col = goodEmotions.includes(e) ? 'var(--gain)' : 'var(--loss)'
            return (
              <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 70 }}>{e}</span>
                <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: journal.length ? `${n / journal.length * 100}%` : '0%', background: col, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-primary)', width: 18, textAlign: 'right', fontWeight: 600 }}>{n}</span>
              </div>
            )
          })}
          <div style={{ marginTop: 14, fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
            <em>"The most important quality for an investor is temperament, not intellect."</em> — Buffett
          </div>
        </div>
      </div>
    </div>
  )
}