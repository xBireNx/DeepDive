import { useState } from 'react'
import { useStore } from '../../store'

const CHECKLIST = [
  { id: 'q1', cat: 'Business Quality', text: 'Does the company have a durable competitive advantage (brand, cost, network effect, switching cost)?' },
  { id: 'q2', cat: 'Business Quality', text: 'Can you understand how the company makes money in one sentence?' },
  { id: 'q3', cat: 'Business Quality', text: 'Is the business protected from technological disruption for the next 10 years?' },
  { id: 'q4', cat: 'Business Quality', text: 'Does the company have pricing power — can it raise prices without losing customers?' },
  { id: 'q5', cat: 'Financials', text: 'Is ROCE > 15% consistently over the last 5 years?' },
  { id: 'q6', cat: 'Financials', text: 'Is the company debt-free or D/E < 0.5?' },
  { id: 'q7', cat: 'Financials', text: 'Is FCF consistently positive and tracking close to reported profits (FCF/PAT > 60%)?' },
  { id: 'q8', cat: 'Financials', text: 'Has revenue grown at > 15% CAGR over 3–5 years?' },
  { id: 'q9', cat: 'Financials', text: 'Are net margins stable or expanding over the last 4 quarters?' },
  { id: 'q10', cat: 'Financials', text: 'Is the Beneish M-Score < −2.22 (clean earnings)?' },
  { id: 'q11', cat: 'Management', text: 'Is promoter holding > 50% with no pledging?' },
  { id: 'q12', cat: 'Management', text: 'Has promoter holding been stable or increasing over last 8 quarters?' },
  { id: 'q13', cat: 'Management', text: 'Is management compensation reasonable relative to profits?' },
  { id: 'q14', cat: 'Management', text: 'Have management promises from past concalls/annual reports been kept?' },
  { id: 'q15', cat: 'Valuation', text: 'Is the stock trading below your DCF intrinsic value with adequate margin of safety?' },
  { id: 'q16', cat: 'Valuation', text: "Is P/E below the company's own 3-year historical average?" },
  { id: 'q17', cat: 'Valuation', text: 'Would you be comfortable holding for at least 3 years regardless of market price?' },
  { id: 'q18', cat: 'Risk', text: 'Have you identified the key risks that could break your thesis?' },
  { id: 'q19', cat: 'Risk', text: 'Does customer concentration risk exist (top 3 customers < 30% of revenue)?' },
  { id: 'q20', cat: 'Risk', text: 'Is there a clear catalyst for the market to recognise value within your time horizon?' },
]

const CATS = [...new Set(CHECKLIST.map(q => q.cat))]

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function Checklist({ data }) {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  const { checkState, toggleCheck, resetChecklist } = useStore()
  const sym = data?.symbol || 'GENERAL'
  const state = checkState[sym] || {}
  const checked = CHECKLIST.filter(q => state[q.id]).length
  const pct = Math.round(checked / CHECKLIST.length * 100)
  const readyColor = pct >= 80 ? 'var(--gain)' : pct >= 60 ? 'var(--warning)' : 'var(--loss)'

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
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Checklist</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>{data?.symbol || 'General'}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 11, padding: '6px 12px', background: `${readyColor}20`, color: readyColor, borderRadius: 8, fontWeight: 700 }}>
              {checked}/{CHECKLIST.length} PASSED
            </span>
          </div>
        </div>
      </div>

      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: readyColor, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          {CATS.map(cat => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10,
                color: 'var(--accent-primary)',
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 10,
                paddingBottom: 6,
                borderBottom: '1px solid var(--accent-primary)30'
              }}>
                {cat}
              </div>
              {CHECKLIST.filter(q => q.cat === cat).map(q => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCheck(sym, q.id)}>
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: state[q.id] ? 'none' : '2px solid var(--border-default)',
                    background: state[q.id] ? 'var(--gain)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2
                  }}>
                    {state[q.id] && <span style={{ color: '#000', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: state[q.id] ? 'var(--text-dim)' : 'var(--text-primary)',
                    lineHeight: 1.5,
                    flex: 1,
                    textDecoration: state[q.id] ? 'line-through' : undefined,
                  }}>
                    {q.text}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SecHeader label="Score" collapsed={collapsed.score} onToggle={() => toggleSection('score')} />
          {!collapsed.score && (
            <div className="panel" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Readiness</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 800, color: readyColor, lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{checked} of {CHECKLIST.length} checks</div>
              <div style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: readyColor, padding: '10px 14px', borderRadius: 8, background: `${readyColor}15` }}>
                {pct >= 80 ? 'INVESTMENT READY' : pct >= 60 ? 'PROCEED WITH CAUTION' : 'INSUFFICIENT DATA'}
              </div>
              <button onClick={() => resetChecklist(sym)} style={{ marginTop: 16, width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>Clear All</button>
            </div>
          )}

          <SecHeader label="Principles" collapsed={collapsed.principles} onToggle={() => toggleSection('principles')} />
          {!collapsed.principles && (
            <div className="panel" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Rule 1:</strong> Never lose money.
                </div>
                <div style={{ marginBottom: 12, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Rule 2:</strong> Never forget Rule 1.
                </div>
                <div style={{ fontStyle: 'italic', marginBottom: 10, padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 6, borderLeft: '3px solid var(--accent-primary)', fontSize: 11 }}>
                  "Price is what you pay. Value is what you get."
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  Strategy: Buy right, sit tight. Conviction is built through deep research.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}