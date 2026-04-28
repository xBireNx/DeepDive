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
  const [expanded, setExpanded] = useState({})
  const toggleExpand = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }))

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
      <div className="spinner" />
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 10 }}>Fetching news...</div>
    </div>
  )

  const sent = news?.sentiment || {}
  const arts = news?.articles || []
  const sentScore = ((sent.score || 0) + 2) / 4 * 100
  const col = sentColor(sent.score || 0)
  const total = sent.total || 1

  const getSentimentEmoji = (s) => {
    if (s >= 1) return '🔥'
    if (s > 0) return '↗'
    if (s <= -1) return '🔻'
    if (s < 0) return '↘'
    return '→'
  }

  return (
    <div style={{ padding: '0 0 20px 0' }}>
      {/* Header Card */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)', 
        border: '1px solid var(--border-default)', 
        borderRadius: 14, 
        padding: 16, 
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${col}, var(--accent-primary))` }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{data.symbol}</span>
              <span style={{ fontSize: 24 }}>{getSentimentEmoji(sent.score)}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>News & Sentiment Analysis</div>
          </div>
          <button className="btn-sm" onClick={() => load(true)} style={{ background: 'var(--bg-tertiary)' }}>↻</button>
        </div>

        {/* Score Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Sentiment Score</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: col }}>{sent.overall || 'Neutral'}</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${sentScore}%`, background: `linear-gradient(90deg, ${col}, ${col}80)`, borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 50 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: col }}>{(sent.score || 0).toFixed(1)}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>/ 2.0</div>
          </div>
        </div>

        {/* Stats Pills */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'var(--gain-dim)', borderRadius: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gain)' }}>{sent.positive || 0}</div>
            <div style={{ fontSize: 9, color: 'var(--gain)' }}>Positive</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-secondary)' }}>{sent.neutral || 0}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Neutral</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'var(--loss-dim)', borderRadius: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--loss)' }}>{sent.negative || 0}</div>
            <div style={{ fontSize: 9, color: 'var(--loss)' }}>Negative</div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Latest News</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {news?.sources?.slice(0, 4).map((src, i) => (
            <span key={i} style={{ fontSize: 8, padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: 4, color: 'var(--text-dim)' }}>
              {src}
            </span>
          ))}
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{arts.length} articles</span>
        </div>
      </div>

      {arts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📰</div>
          <div style={{ fontSize: 13 }}>No recent news available</div>
        </div>
      )}

      {arts.map((a, i) => {
        const s = a.sentiment || {}
        return (
          <div 
            key={i} 
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-default)', 
              borderRadius: 12, 
              marginBottom: 10,
              overflow: 'hidden',
              borderLeft: `3px solid ${sentColor(s.score)}`
            }}
          >
            {/* Article Header */}
            <div style={{ padding: '12px 12px 8px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>{a.source || 'News'}</span>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>•</span>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{a.published || ''}</span>
                {a.type && a.type !== 'general' && (
                  <span style={{ 
                    fontSize: 8, 
                    padding: '2px 6px', 
                    borderRadius: 4, 
                    background: a.type === 'regulatory' ? 'var(--warning-dim)' : a.type === 'earnings' ? 'var(--gain-dim)' : 'var(--accent-dim)',
                    color: a.type === 'regulatory' ? 'var(--warning)' : a.type === 'earnings' ? 'var(--gain)' : 'var(--accent-primary)',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}>{a.type}</span>
                )}
                <span className={`badge ${sentBadge(s.label)}`} style={{ fontSize: 8, padding: '2px 6px', marginLeft: 'auto' }}>{s.label || 'N'}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
                {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>{a.title}</a> : a.title}
              </div>
            </div>

            {/* Summary (collapsible) */}
            {a.summary && (
              <div style={{ padding: '0 12px 8px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.summary}</div>
              </div>
            )}

            {/* Keywords */}
            {(s.posKeywords?.length > 0 || s.negKeywords?.length > 0) && (
              <div style={{ padding: '0 12px 12px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(s.posKeywords || []).map(k => (
                  <span key={k} style={{ 
                    fontSize: 10, 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    color: 'var(--gain)', 
                    padding: '3px 8px', 
                    borderRadius: 6,
                    fontWeight: 600 
                  }}>↑ {k}</span>
                ))}
                {(s.negKeywords || []).map(k => (
                  <span key={k} style={{ 
                    fontSize: 10, 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    color: 'var(--loss)', 
                    padding: '3px 8px', 
                    borderRadius: 6,
                    fontWeight: 600 
                  }}>↓ {k}</span>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Guide Card */}
      <div style={{ 
        background: 'var(--bg-tertiary)', 
        borderRadius: 12, 
        padding: 14, 
        marginTop: 16 
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 10 }}>Sentiment Guide</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['🔥 Very Positive', 'Record results, orders', 'var(--gain)'],
            ['↗ Positive', 'Earnings beat, growth', 'var(--gain)'],
            ['→ Neutral', 'Routine updates', 'var(--text-dim)'],
            ['↘ Negative', 'Misses, delays', 'var(--loss)'],
            ['🔻 Very Negative', 'Fraud, raids, notices', 'var(--loss)'],
          ].map(([emoji, desc, col]) => (
            <div key={emoji} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <span style={{ color: col }}>{emoji}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}