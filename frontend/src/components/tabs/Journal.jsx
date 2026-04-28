import { useState } from 'react'
import { useStore } from '../../store'
import { showToast } from '../Toast'

const EMOTIONS = ['', 'Confident', 'FOMO', 'Fearful', 'Greedy', 'Patient', 'Disciplined']

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function Journal() {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

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
    <div style={{ padding: '0 0 20px 0' }}>
      <div style={{ 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-default)', 
        borderRadius: 14, 
        padding: 16, 
        marginBottom: 16 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Journal</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>{journal.length} entries</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 10, padding: '4px 8px', background: 'var(--gain-dim)', color: 'var(--gain)', borderRadius: 6, fontWeight: 700 }}>{buys} Buys</span>
            <span style={{ fontSize: 10, padding: '4px 8px', background: 'var(--loss-dim)', color: 'var(--loss)', borderRadius: 6, fontWeight: 700 }}>{sells} Sells</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          <SecHeader label="Log Trade" collapsed={collapsed.log} onToggle={() => toggleSection('log')} />
          {!collapsed.log && (
            <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                <select className="select" value={form.ticker} onChange={e => f('ticker', e.target.value)} style={{ fontSize: 11 }}>
                  <option value="">Select Stock</option>
                  {allTickers.map(t => <option key={t}>{t}</option>)}
                </select>
                <select className="select" value={form.action} onChange={e => f('action', e.target.value)} style={{ fontSize: 11 }}>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                  <option value="WATCH">WATCH</option>
                </select>
                <input className="input" type="number" placeholder="Price ₹" value={form.price} onChange={e => f('price', e.target.value)} style={{ fontSize: 11 }} />
                <input className="input" type="number" placeholder="Qty" value={form.qty} onChange={e => f('qty', e.target.value)} style={{ fontSize: 11 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                <input className="input" type="date" value={form.date} onChange={e => f('date', e.target.value)} style={{ fontSize: 10 }} />
                <select className="select" value={form.emotion} onChange={e => f('emotion', e.target.value)} style={{ fontSize: 11 }}>
                  {EMOTIONS.map(e => <option key={e} value={e}>{e || 'Emotion?'}</option>)}
                </select>
                <input className="input" type="number" placeholder="Target ₹" value={form.target} onChange={e => f('target', e.target.value)} style={{ fontSize: 11 }} />
                <input className="input" type="number" placeholder="Stop-Loss ₹" value={form.sl} onChange={e => f('sl', e.target.value)} style={{ fontSize: 11 }} />
              </div>
              <textarea
                className="input"
                style={{ height: 60, resize: 'vertical', fontSize: 11 }}
                placeholder="Investment thesis — Why? What catalyst? What breaks the thesis?"
                value={form.thesis}
                onChange={e => f('thesis', e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn-primary" onClick={doAdd} style={{ fontSize: 11, padding: '6px 14px', borderRadius: 8 }}>+ Log Entry</button>
              </div>
            </div>
          )}

          <SecHeader label="Entries" collapsed={collapsed.entries} onToggle={() => toggleSection('entries')} />
          {!collapsed.entries && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {journal.length === 0 && (
                <div className="empty-state" style={{ minHeight: 100 }}>
                  <div className="empty-title">No entries yet</div>
                </div>
              )}
              {journal.map((j, i) => (
                <div key={i} className="panel" style={{ padding: 12, position: 'relative' }}>
                  <button
                    onClick={() => { removeJournalEntry(i); showToast('Entry deleted') }}
                    style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}
                  >
                    ✕
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{j.ticker}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, 
                      background: j.action === 'BUY' ? 'var(--gain-dim)' : j.action === 'SELL' ? 'var(--loss-dim)' : 'var(--accent-dim)',
                      color: j.action === 'BUY' ? 'var(--gain)' : j.action === 'SELL' ? 'var(--loss)' : 'var(--accent-primary)'
                    }}>{j.action}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{j.date}</span>
                    {j.emotion && <span style={{ fontSize: 9, color: 'var(--warning)' }}>{j.emotion}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{j.thesis || 'No thesis recorded.'}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
                    {j.price && <span style={{ color: 'var(--text-tertiary)' }}>Price <strong style={{ color: 'var(--text-primary)' }}>₹{j.price}</strong></span>}
                    {j.qty && <span style={{ color: 'var(--text-tertiary)' }}>Qty <strong style={{ color: 'var(--text-primary)' }}>{j.qty}</strong></span>}
                    {j.target && <span style={{ color: 'var(--gain)' }}>Target ₹{j.target}</span>}
                    {j.sl && <span style={{ color: 'var(--loss)' }}>SL ₹{j.sl}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SecHeader label="Stats" collapsed={collapsed.stats} onToggle={() => toggleSection('stats')} />
          {!collapsed.stats && (
            <div className="panel" style={{ padding: 14 }}>
              {[
                ['Total', journal.length, 'var(--text-tertiary)'],
                ['Buys', buys, 'var(--gain)'],
                ['Sells', sells, 'var(--loss)'],
                ['Stocks', [...new Set(journal.map(j => j.ticker))].length, 'var(--text-tertiary)']
              ].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                  <span style={{ fontWeight: 700, color: c }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          <SecHeader label="Behavior" collapsed={collapsed.behavior} onToggle={() => toggleSection('behavior')} />
          {!collapsed.behavior && (
            <div className="panel" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 10 }}>Emotion Tracker</div>
              {emotions.map(e => {
                const n = emotionCounts[e] || 0
                const col = goodEmotions.includes(e) ? 'var(--gain)' : 'var(--loss)'
                return (
                  <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 65 }}>{e}</span>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: journal.length ? `${n / journal.length * 100}%` : '0%', background: col, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, width: 16, textAlign: 'right' }}>{n}</span>
                  </div>
                )
              })}
              <div style={{ marginTop: 12, fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <em>"The most important quality for an investor is temperament, not intellect."</em> — Buffett
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}