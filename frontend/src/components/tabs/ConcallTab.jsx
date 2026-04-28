import { useState, useEffect } from 'react'
import { useStore } from '../../store'

export default function ConcallTab({ data }) {
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
        const res = await fetch(`/api/concall/${data.symbol}`)
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
      <div className="empty-text">Select a stock first</div>
    </div>
  )

  if (!backendLive) return (
    <div className="empty-state">
      <div className="empty-icon">✆</div>
      <div className="empty-text">Backend offline</div>
    </div>
  )

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <div className="loading-text">Extracting Concall Insights via LLM...</div>
    </div>
  )

  if (error || !concall) return (
    <div className="empty-state">
      <div className="empty-icon">⚠</div>
      <div className="empty-text">Could not load Concall Summary</div>
    </div>
  )

  const getSentimentColor = (s) => {
    if (s === 'Bullish' || s === 'Positive') return 'var(--success)'
    if (s === 'Cautious' || s === 'Negative') return 'var(--error)'
    return 'var(--primary)'
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 6 }}>Earnings Call Intelligence</h3>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>Reported: {concall.quarter} • {concall.date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', fontWeight: 800, color: getSentimentColor(concall.sentiment), lineHeight: 1 }}>
              {concall.tone_score}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dim)' }}>/100</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)', marginTop: 6 }}>Confidence</div>
          </div>
        </div>

        <div className="sec" style={{ marginBottom: 14 }}>
          <span className="sec-l">Strategic Outlook</span>
          <div className="sec-line" style={{ flex: 1 }} />
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32, padding: '0 4px' }}>
          {concall.guidance}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 32 }}>
          {concall.segments?.map((seg, i) => (
            <div key={i} style={{ padding: 18, background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{seg.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{seg.detail}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <div style={{ padding: 16, background: 'var(--success-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📈</span> Bull Takeaways
            </div>
            {concall.bull_case?.map((point, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--success)' }}>•</span> {point}
              </div>
            ))}
          </div>
          <div style={{ padding: 16, background: 'var(--error-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--error)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📉</span> Bear Takeaways
            </div>
            {concall.bear_case?.map((point, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--error)' }}>•</span> {point}
              </div>
            ))}
          </div>
        </div>

        <div className="sec" style={{ marginBottom: 14 }}>
          <span className="sec-l">Management Q&A Insights</span>
          <div className="sec-line" style={{ flex: 1 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {concall.analyst_qna.map((qna, i) => (
            <div key={i} style={{ padding: 18, background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: getSentimentColor(qna.sentiment) }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 10, display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>Q</span> {qna.q}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>A</span> {qna.a}
              </div>
              <div style={{ fontSize: 11, color: getSentimentColor(qna.sentiment), fontWeight: 700, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {qna.sentiment} Response
              </div>
            </div>
          ))}
        </div>

        {concall.red_flags?.length > 0 && (
          <div style={{ marginTop: 24, padding: 16, background: 'var(--error-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--error)', marginBottom: 10 }}>⚠ Critical Red Flags / Risks</div>
            {concall.red_flags.map((rf, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>• {rf}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}