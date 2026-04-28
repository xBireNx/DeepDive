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

export default function Checklist({ data }) {
  const { checkState, toggleCheck, resetChecklist } = useStore()
  const sym = data?.symbol || 'GENERAL'
  const state = checkState[sym] || {}
  const checked = CHECKLIST.filter(q => state[q.id]).length
  const pct = Math.round(checked / CHECKLIST.length * 100)
  const readyColor = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)'

  return (
    <div>
      <div className="sec">
        <span className="sec-l">Investment Checklist{data ? ` — ${sym}` : ''}</span>
        <div className="sec-line" style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{checked}/{CHECKLIST.length} PASSED</span>
      </div>

      <div style={{ height: 8, background: 'var(--surface-hover)', borderRadius: 4, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: readyColor, borderRadius: 4, transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </div>

      <div className="layout-2col">
        <div>
          {CATS.map(cat => (
            <div key={cat} style={{ marginBottom: 28 }}>
              <div style={{
                fontSize: 12,
                color: 'var(--text-dim)',
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: '1px solid var(--border)'
              }}>
                {cat}
              </div>
              {CHECKLIST.filter(q => q.cat === cat).map(q => (
                <div key={q.id} className="checklist-row">
                  <div
                    className={`checkbox ${state[q.id] ? 'checked' : ''}`}
                    onClick={() => toggleCheck(sym, q.id)}
                  >
                    {state[q.id] && <span>✓</span>}
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: state[q.id] ? 'var(--text-dim)' : 'var(--text)',
                    lineHeight: 1.6,
                    flex: 1,
                    textDecoration: state[q.id] ? 'line-through' : undefined,
                    transition: 'color 0.2s'
                  }}>
                    {q.text}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-panel">
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div className="card-title">Readiness Score</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 60, fontWeight: 800, color: readyColor, lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 10, fontWeight: 600 }}>{checked} of {CHECKLIST.length} checks completed</div>
            <div style={{ marginTop: 24, fontSize: 15, fontWeight: 700, color: readyColor, padding: '12px', borderRadius: 10, background: `${readyColor}15` }}>
              {pct >= 80 ? 'INVESTMENT READY' : pct >= 60 ? 'PROCEED WITH CAUTION' : 'INSUFFICIENT DATA'}
            </div>
            <button className="btn-outline" style={{ marginTop: 24, width: '100%', padding: '14px' }} onClick={() => resetChecklist(sym)}>Clear All Checks</button>
          </div>

          <div className="card" style={{ padding: '24px 20px' }}>
            <div className="card-title">Investment Principles</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.9 }}>
              <div style={{ marginBottom: 12 }}>
                <strong style={{ color: 'var(--text)' }}>Rule 1:</strong> Never lose money.
              </div>
              <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <strong style={{ color: 'var(--text)' }}>Rule 2:</strong> Never forget Rule 1.
              </div>
              <div style={{ fontStyle: 'italic', marginBottom: 16, padding: '12px 16px', background: 'var(--surface-hover)', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                "Price is what you pay. Value is what you get."
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: 'var(--text)' }}>Strategy:</strong> Buy right, sit tight.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                Conviction is built through deep research, not market noise.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}