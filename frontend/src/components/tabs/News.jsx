import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { showToast } from '../Toast'

const sentBadge = (label = '') => {
  const m = { 'Very Positive': 'tag-g', 'Positive': 'tag-g', 'Negative': 'tag-r', 'Very Negative': 'tag-r' }
  return m[label] || 'tag-m'
}

const sentClass = s => s >= 1 ? 'positive' : s > 0 ? 'positive' : s <= -1 ? 'negative' : s < 0 ? 'negative' : 'neutral'

const sentColor = s => s >= 1 ? 'var(--success)' : s > 0 ? 'var(--success)' : s <= -1 ? 'var(--error)' : s < 0 ? 'var(--warning)' : 'var(--text-dim)'

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
      <div className="empty-text">Select a stock first</div>
    </div>
  )

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <div className="loading-text">Fetching news & sentiment...</div>
    </div>
  )

  const sent = news?.sentiment || {}
  const arts = news?.articles || []
  const sentScore = ((sent.score || 0) + 2) / 4 * 100
  const col = sentColor(sent.score || 0)

  return (
    <div className="layout-2col">
      <div>
        <div className="sec">
          <span className="sec-l">{data.symbol} — News & Sentiment</span>
          <div className="sec-line" style={{ flex: 1 }} />
          <button className="btn-sm" onClick={() => load(true)}>↻ Refresh</button>
        </div>

        {arts.length === 0 && (
          <div className="empty-state" style={{ height: 200 }}>
            <div className="empty-icon">◉</div>
            <div className="empty-text">No news found</div>
          </div>
        )}

        {arts.map((a, i) => {
          const s = a.sentiment || {}
          return (
            <div key={i} className={`news-article ${sentClass(s.score)}`}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.source || 'News'}</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.published || ''}</span>
                <span className={`tag ${sentBadge(s.label)}`}>{s.label || 'Neutral'}</span>
              </div>
              <div className="news-title">
                {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a> : a.title}
              </div>
              {a.summary && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8 }}>{a.summary}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {(s.posKeywords || []).map(k => (
                  <span key={k} style={{ fontSize: 10, background: 'var(--success-muted)', color: 'var(--success)', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>↑ {k}</span>
                ))}
                {(s.negKeywords || []).map(k => (
                  <span key={k} style={{ fontSize: 10, background: 'var(--error-muted)', color: 'var(--error)', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>↓ {k}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="sidebar-panel">
        <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div className="card-title">Sentiment Summary</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: col, marginBottom: 6 }}>{sent.overall || 'Neutral'}</div>
          <div style={{ height: 8, background: 'var(--surface-hover)', borderRadius: 4, overflow: 'hidden', margin: '12px 0 6px' }}>
            <div style={{ height: '100%', width: `${sentScore.toFixed(0)}%`, background: col, borderRadius: 4, transition: 'width 0.6s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>Score: {(sent.score || 0).toFixed(2)} (−2 → +2)</div>

          {[['Positive', sent.positive || 0, 'var(--success)'], ['Neutral', sent.neutral || 0, 'var(--text-dim)'], ['Negative', sent.negative || 0, 'var(--error)']].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 70 }}>{l}</span>
              <div style={{ flex: 1, height: 6, background: 'var(--surface-hover)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: sent.total ? `${(v / sent.total * 100).toFixed(0)}%` : '0%', background: c, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text)', width: 24, textAlign: 'right', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '20px 16px' }}>
          <div className="card-title">Sentiment Guide</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 2 }}>
            {[
              ['Very Positive', 'var(--success)', 'Record results, major orders'],
              ['Positive', 'var(--success)', 'Good earnings, growth news'],
              ['Neutral', 'var(--text-dim)', 'Routine announcements'],
              ['Negative', 'var(--error)', 'Misses, delays, concerns'],
              ['Very Negative', 'var(--error)', 'SEBI notice, fraud, raids']
            ].map(([l, c, d]) => (
              <div key={l} style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ color: c, fontSize: 10 }}>●</span>
                <span style={{ fontWeight: 600, color: c, fontSize: 11 }}>{l}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>— {d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div className="card-title">AI Note</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Keyword-based scoring. Always read full articles — context matters.
          </div>
        </div>
      </div>
    </div>
  )
}