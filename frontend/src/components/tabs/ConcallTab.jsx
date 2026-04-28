import { useState, useEffect } from 'react'
import { useStore, API } from '../../store'

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 12, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function ConcallTab({ data }) {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  const { backendLive } = useStore()
  const [concall, setConcall] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!data?.symbol || !backendLive) return
    let active = true

    const fetchConcall = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API}/concall/${data.symbol}`)
        const json = await res.json()
        if (json.ok && active) setConcall(json.data)
      } catch (e) {
        if (active) setError(e.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchConcall()
    return () => { active = false }
  }, [data?.symbol, backendLive])

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">✆</div>
      <div className="empty-title">Select a stock first</div>
    </div>
  )

  if (!backendLive) return (
    <div className="empty-state">
      <div className="empty-icon">✆</div>
      <div className="empty-title">Backend offline</div>
    </div>
  )

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div className="empty-title">Loading insights...</div>
    </div>
  )

  if (error || !concall) return (
    <div className="empty-state">
      <div className="empty-icon">⚠</div>
      <div className="empty-title">Concall data unavailable</div>
    </div>
  )

  const getSentimentColor = (s) => {
    if (s === 'Bullish' || s === 'Positive') return 'var(--gain)'
    if (s === 'Cautious' || s === 'Negative') return 'var(--loss)'
    return 'var(--accent-primary)'
  }

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
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{data.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>Earnings Call</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: getSentimentColor(concall.sentiment), lineHeight: 1 }}>
              {concall.tone_score}<span style={{ fontSize: 12, color: 'var(--text-dim)' }}>/100</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Confidence</div>
          </div>
        </div>
      </div>

      <SecHeader label="Strategic Outlook" collapsed={collapsed.outlook} onToggle={() => toggleSection('outlook')} />
      {!collapsed.outlook && (
        <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{concall.guidance}</div>
        </div>
      )}

      <SecHeader label="Segments" collapsed={collapsed.segments} onToggle={() => toggleSection('segments')} />
      {!collapsed.segments && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {concall.segments?.map((seg, i) => (
            <div key={i} className="panel" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 6 }}>{seg.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{seg.detail}</div>
            </div>
          ))}
        </div>
      )}

      <SecHeader label="Bull vs Bear" collapsed={collapsed.bb} onToggle={() => toggleSection('bb')} />
      {!collapsed.bb && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div className="panel" style={{ padding: 12, border: '1px solid var(--gain)', background: 'var(--gain-dim)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gain)', marginBottom: 8 }}>Bull Takeaways</div>
            {concall.bull_case?.map((point, i) => (
              <div key={i} style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', gap: 6 }}>
                <span style={{ color: 'var(--gain)' }}>•</span> {point}
              </div>
            ))}
          </div>
          <div className="panel" style={{ padding: 12, border: '1px solid var(--loss)', background: 'var(--loss-dim)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--loss)', marginBottom: 8 }}>Bear Takeaways</div>
            {concall.bear_case?.map((point, i) => (
              <div key={i} style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', gap: 6 }}>
                <span style={{ color: 'var(--loss)' }}>•</span> {point}
              </div>
            ))}
          </div>
        </div>
      )}

      <SecHeader label="Q&A Insights" collapsed={collapsed.qna} onToggle={() => toggleSection('qna')} />
      {!collapsed.qna && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
          {concall.analyst_qna.map((qna, i) => (
            <div key={i} className="panel" style={{ padding: 12, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, width: 4, height: '100%', background: getSentimentColor(qna.sentiment) }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                <span style={{ color: 'var(--accent-primary)' }}>Q:</span> {qna.q}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                <span style={{ color: 'var(--gain)', fontWeight: 700 }}>A:</span> {qna.a}
              </div>
              <span style={{ fontSize: 9, color: getSentimentColor(qna.sentiment), fontWeight: 700, textTransform: 'uppercase' }}>{qna.sentiment}</span>
            </div>
          ))}
        </div>
      )}

      {concall.red_flags?.length > 0 && (
        <>
          <SecHeader label="Red Flags" collapsed={collapsed.flags} onToggle={() => toggleSection('flags')} />
          {!collapsed.flags && (
            <div className="panel" style={{ padding: 14, border: '1px solid var(--loss)', background: 'var(--loss-dim)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--loss)', marginBottom: 8 }}>⚠ Critical Risks</div>
              {concall.red_flags.map((rf, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>• {rf}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}