import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { showToast } from '../Toast'

const sentBadge = (label = '') => {
  const m = { 'Very Positive': 'badge-gain', 'Positive': 'badge-gain', 'Negative': 'badge-loss', 'Very Negative': 'badge-loss' }
  return m[label] || 'badge-neutral'
}

const sentClass = s => s >= 1 ? 'positive' : s > 0 ? 'positive' : s <= -1 ? 'negative' : s < 0 ? 'negative' : 'neutral'

const sentColor = s => s >= 1 ? 'var(--gain)' : s > 0 ? 'var(--gain)' : s <= -1 ? 'var(--loss)' : s < 0 ? 'var(--warning)' : 'var(--text-dim)'

export default function News({ data }) {
  const { fetchNews, newsCache, clearNewsCache } = useStore()
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async (force = false) => {
    if (!data) return
    if (force) clearNewsCache(data.symbol)
    if (!force && newsCache[data.symbol]) { setNews(newsCache[data.symbol]); return }
    setLoading(true)
    try {
      const n = await fetchNews(data.symbol)
      setNews(n)
    } catch (e) { showToast('News unavailable', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (data) load() }, [data?.symbol])

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">◉</div>
      <div className="empty-title">Select a stock first</div>
    </div>
  )

  if (loading) return (
    <div className="loading">
      <div className="spinner" style={{ width: 28, height: 28 }} />
      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 12 }}>Fetching news & sentiment...</div>
    </div>
  )

  const sent = news?.sentiment || {}
  const arts = news?.articles || []
  const sentScore = ((sent.score || 0) + 2) / 4 * 100
  const col = sentColor(sent.score || 0)

  return (
    <div className="layout-2col">
      <div>
        <div className="section-header">
          <span className="section-title">{data.symbol} — News & Sentiment</span>
          <div className="section-line" style={{ flex: 1 }} />
          <button className="btn-sm" onClick={() => load(true)}>↻ Refresh</button>
        </div>

        {arts.length === 0 && (
          <div className="empty-state" style={{ minHeight: 200 }}>
            <div className="empty-icon">◉</div>
            <div className="empty-title">No news found</div>
          </div>
        )}

        {arts.map((a, i) => {
          const s = a.sentiment || {}
          return (
            <div key={i} className={`news-item ${sentClass(s.score)}`}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{a.source || 'News'}</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{a.published || ''}</span>
                <span className={`badge ${sentBadge(s.label)}`}>{s.label || 'Neutral'}</span>
              </div>
              <div className="news-title">
                {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a> : a.title}
              </div>
              {a.summary && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>{a.summary}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {(s.posKeywords || []).map(k => (
                  <span key={k} style={{ fontSize: 10, background: 'var(--gain-dim)', color: 'var(--gain)', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>↑ {k}</span>
                ))}
                {(s.negKeywords || []).map(k => (
                  <span key={k} style={{ fontSize: 10, background: 'var(--loss-dim)', color: 'var(--loss)', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>↓ {k}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="panel" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div className="panel-title">Sentiment Summary</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 800, color: col, marginBottom: 6 }}>{sent.overall || 'Neutral'}</div>
          <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden', margin: '10px 0 6px' }}>
            <div style={{ height: '100%', width: `${sentScore.toFixed(0)}%`, background: col, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 14 }}>Score: {(sent.score || 0).toFixed(2)} (−2 → +2)</div>

          {[['Positive', sent.positive || 0, 'var(--gain)'], ['Neutral', sent.neutral || 0, 'var(--text-dim)'], ['Negative', sent.negative || 0, 'var(--loss)']].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 60 }}>{l}</span>
              <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: sent.total ? `${(v / sent.total * 100).toFixed(0)}%` : '0%', background: c, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-primary)', width: 20, textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{v}</span>
            </div>
          ))}
        </div>

        <div className="panel" style={{ padding: '16px' }}>
          <div className="panel-title">Sentiment Guide</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            {[
              ['Very Positive', 'var(--gain)', 'Record results, major orders'],
              ['Positive', 'var(--gain)', 'Good earnings, growth news'],
              ['Neutral', 'var(--text-dim)', 'Routine announcements'],
              ['Negative', 'var(--loss)', 'Misses, delays, concerns'],
              ['Very Negative', 'var(--loss)', 'SEBI notice, fraud, raids']
            ].map(([l, c, d]) => (
              <div key={l} style={{ marginBottom: 6, display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span style={{ color: c, fontSize: 9 }}>●</span>
                <span style={{ fontWeight: 700, color: c, fontSize: 10 }}>{l}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>— {d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ padding: '14px' }}>
          <div className="panel-title">AI Note</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Keyword-based scoring. Always read full articles — context matters.
          </div>
        </div>
      </div>
    </div>
  )
}