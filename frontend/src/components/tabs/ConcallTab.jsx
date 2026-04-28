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

  if (!data) return <div className="empty-state">Select a stock first</div>
  if (!backendLive) return <div className="empty-state">Backend offline</div>
  if (loading) return <div className="empty-state">Extracting Concall Insights via LLM...</div>
  if (error || !concall) return <div className="empty-state">Could not load Concall Summary</div>

  const getSentimentColor = (s) => {
    if (s === 'Bullish' || s === 'Positive') return 'var(--success)'
    if (s === 'Cautious' || s === 'Negative') return 'var(--error)'
    return 'var(--primary)'
  }

  return (
    <div className="tab-pane fade-in">
      {/* Header & Tone Score */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 4 }}>Earnings Call Intelligence</h3>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>Reported: {concall.quarter} • {concall.date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 800, color: getSentimentColor(concall.sentiment), lineHeight: 1 }}>{concall.tone_score}<span style={{fontSize:14, fontWeight:500, color:'var(--text-dim)'}}>/100</span></div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)', marginTop: 4 }}>Confidence</div>
          </div>
        </div>

        <div className="sec" style={{ marginBottom: 12 }}><span className="sec-l">Strategic Outlook</span><div className="sec-line"/></div>
        <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32, padding: '0 4px' }}>
          {concall.guidance}
        </div>

        {/* Segments Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
          {concall.segments?.map((seg, i) => (
            <div key={i} style={{ padding: 20, background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{seg.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{seg.detail}</div>
            </div>
          ))}
        </div>

        {/* Bull vs Bear Cases */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 25 }}>
          <div style={{ padding: 15, background: 'rgba(34,197,94,0.03)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.1)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>📈</span> BULL TAKEAWAYS
            </div>
            {concall.bull_case?.map((point, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--green)' }}>•</span> {point}
              </div>
            ))}
          </div>
          <div style={{ padding: 15, background: 'rgba(239,68,68,0.03)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.1)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>📉</span> BEAR TAKEAWAYS
            </div>
            {concall.bear_case?.map((point, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--red)' }}>•</span> {point}
              </div>
            ))}
          </div>
        </div>

        {/* Q&A Section */}
        <div className="sec" style={{ marginBottom: 12 }}><span className="sec-l">Management Q&A Insights</span><div className="sec-line"/></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {concall.analyst_qna.map((qna, i) => (
            <div key={i} style={{ padding: 20, background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: getSentimentColor(qna.sentiment) }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10, display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--primary)' }}>Q</span> {qna.q}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>A</span> {qna.a}
              </div>
              <div style={{ fontSize: 11, color: getSentimentColor(qna.sentiment), fontWeight: 800, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                {qna.sentiment} Response
              </div>
            </div>
          ))}
        </div>

        {concall.red_flags?.length > 0 && (
          <div style={{ marginTop: 25, padding: 15, background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid var(--red)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--red)', marginBottom: 10 }}>CRITICAL RED FLAGS / RISKS</div>
            {concall.red_flags.map((rf, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>• {rf}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
