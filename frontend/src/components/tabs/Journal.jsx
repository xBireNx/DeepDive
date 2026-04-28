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
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>Log Trade / Observation</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <select className="select" value={form.ticker} onChange={e => f('ticker', e.target.value)}>
              <option value="">Select Stock</option>
              {allTickers.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="select" value={form.action} onChange={e => f('action', e.target.value)}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
              <option value="WATCH">WATCH</option>
            </select>
            <input className="input" type="number" placeholder="Price ₹" value={form.price} onChange={e => f('price', e.target.value)} />
            <input className="input" type="number" placeholder="Qty" value={form.qty} onChange={e => f('qty', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input className="input" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            <select className="select" value={form.emotion} onChange={e => f('emotion', e.target.value)}>
              {EMOTIONS.map(e => <option key={e} value={e}>{e || 'Emotion?'}</option>)}
            </select>
            <input className="input" type="number" placeholder="Target ₹" value={form.target} onChange={e => f('target', e.target.value)} />
            <input className="input" type="number" placeholder="Stop-Loss ₹" value={form.sl} onChange={e => f('sl', e.target.value)} />
          </div>
          <textarea
            className="textarea"
            style={{ height: 80 }}
            placeholder="Investment thesis — Why? What catalyst? What breaks the thesis?"
            value={form.thesis}
            onChange={e => f('thesis', e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn-primary" onClick={doAdd}>+ Log Entry</button>
          </div>
        </div>

        {journal.length === 0 && (
          <div className="empty-state" style={{ height: 160 }}>
            <div className="empty-icon">◩</div>
            <div className="empty-text">No entries yet</div>
          </div>
        )}

        {journal.map((j, i) => (
          <div key={i} className="j-entry">
            <button
              className="btn-sm-red"
              style={{ position: 'absolute', right: 12, top: 12 }}
              onClick={() => { removeJournalEntry(i); showToast('Entry deleted') }}
            >
              ✕
            </button>
            <div className="j-entry-header">
              <span className="j-ticker">{j.ticker}</span>
              <span className={`j-action ${j.action.toLowerCase()}`}>{j.action}</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{j.date}</span>
              {j.emotion && <span style={{ fontSize: 11, color: 'var(--warning)' }}>{j.emotion}</span>}
            </div>
            <div className="j-thesis">{j.thesis || 'No thesis recorded.'}</div>
            <div className="j-meta">
              {j.price && <span>Price <strong>₹{j.price}</strong></span>}
              {j.qty && <span>Qty <strong>{j.qty}</strong></span>}
              {j.target && <span style={{ color: 'var(--success)' }}>Target ₹{j.target}</span>}
              {j.sl && <span style={{ color: 'var(--error)' }}>SL ₹{j.sl}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-panel">
        <div className="card" style={{ padding: '20px 16px' }}>
          <div className="card-title">Stats</div>
          {[
            ['Total', journal.length, ''],
            ['Buys', buys, 'cg'],
            ['Sells', sells, 'cr'],
            ['Stocks', [...new Set(journal.map(j => j.ticker))].length, '']
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>{l}</span>
              <span className={c} style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '20px 16px' }}>
          <div className="card-title">Behavioral Tracker</div>
          {emotions.map(e => {
            const n = emotionCounts[e] || 0
            const col = goodEmotions.includes(e) ? 'var(--success)' : 'var(--error)'
            return (
              <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 80 }}>{e}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--surface-hover)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: journal.length ? `${n / journal.length * 100}%` : '0%', background: col, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text)', width: 20, textAlign: 'right', fontWeight: 600 }}>{n}</span>
              </div>
            )
          })}
          <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.7, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <em>"The most important quality for an investor is temperament, not intellect."</em> — Buffett
          </div>
        </div>
      </div>
    </div>
  )
}