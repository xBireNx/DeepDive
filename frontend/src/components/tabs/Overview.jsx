import { useState } from 'react'
import { fN, fCr, gradeColor, scoreColor } from '../../utils'
import { PriceChart, QuarterlyChart, DonutChart, ScoreRadar } from '../charts'

const SecHeader = ({ label, children, collapsed, onToggle }) => (
  <div className="section-header" onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginTop: 20, marginBottom: 12 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {children}
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

function ScoreCard({ card, collapsed }) {
  if (collapsed) return null
  const bc = scoreColor(card.score, card.max_score)
  return (
    <div className="panel" style={{ padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{card.category}</span>
        <div className="progress-bar" style={{ width: 50 }}>
          <div className="progress-fill" style={{ width: `${card.score / card.max_score * 100}%`, background: bc }} />
        </div>
        <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{card.score}/{card.max_score}</span>
      </div>
      {card.narrative && <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>{card.narrative}</p>}
      <div style={{ fontSize: 10 }}>
        {(card.signals || []).slice(0, 3).map(([n, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>{n}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Overview({ data }) {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">◈</div>
      <div className="empty-title">Select a stock to analyze</div>
      <div className="empty-hint">Search and add stocks from sidebar</div>
    </div>
  )

  const { company, price, ratios, fundamental, technical, shareholding, quarterly, promoterHistory, dividends, priceHistory } = data
  const r = ratios || {}
  const f = fundamental || {}
  const t = technical || {}
  const isPos = (price?.ret1m || 0) >= 0
  const cc = isPos ? 'var(--gain)' : 'var(--loss)'
  
  const calcRp = () => {
    const curr = price?.current || 0
    const low = price?.week52Low || 0
    const high = price?.week52High || 1
    if (high === low) return 50
    return (((curr - low) / (high - low)) * 100).toFixed(1)
  }
  const rp = calcRp()
  
  const beneishColor = f.beneish?.score < -2.22 ? 'var(--gain)' : f.beneish?.score < -1.78 ? 'var(--warning)' : f.beneish?.score ? 'var(--loss)' : 'var(--text-dim)'
  const altmanColor = f.altman?.score > 2.99 ? 'var(--gain)' : f.altman?.score > 1.81 ? 'var(--warning)' : f.altman?.score ? 'var(--loss)' : 'var(--text-dim)'
  const trendCol = t.longPct >= 60 ? 'var(--gain)' : t.longPct <= 40 ? 'var(--loss)' : 'var(--warning)'

  const statCards = [
    ['P/E', fN(r.pe, '', 'x', 1), r.pe > 60 ? 'text-loss' : r.pe < 20 ? 'text-gain' : ''],
    ['ROE', fN(r.roe, '', '%', 1), r.roe > 15 ? 'text-gain' : r.roe > 10 ? 'text-secondary' : 'text-loss'],
    ['D/E', fN(r.debt_to_equity, '', 'x', 2), r.debt_to_equity < 0.3 ? 'text-gain' : r.debt_to_equity < 1 ? 'text-secondary' : 'text-loss'],
    ['Net Margin', fN(r.profit_margin, '', '%', 1), r.profit_margin > 10 ? 'text-gain' : r.profit_margin > 5 ? 'text-secondary' : 'text-loss'],
    ['Rev Growth', fN(r.revenue_growth, '', '%', 1), r.revenue_growth > 20 ? 'text-gain' : r.revenue_growth > 10 ? 'text-secondary' : 'text-loss'],
    ['Op Margin', fN(r.op_margin, '', '%', 1), r.op_margin > 15 ? 'text-gain' : r.op_margin > 8 ? 'text-secondary' : 'text-loss'],
    ['P/B', fN(r.pb, '', 'x', 1), r.pb < 3 ? 'text-gain' : r.pb < 7 ? 'text-secondary' : 'text-loss'],
    ['EV/EBITDA', fN(r.ev_ebitda, '', 'x', 1), r.ev_ebitda < 15 ? 'text-gain' : r.ev_ebitda < 25 ? 'text-secondary' : 'text-loss'],
  ]

  return (
    <div style={{ padding: '0 0 20px 0' }}>
      {/* Hero Section */}
      <div className="hero-section" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span className="hero-ticker" style={{ fontSize: 24 }}>{data.symbol}</span>
              {f.grade && <span className="grade-badge" style={{ fontSize: 14 }}>{f.grade}</span>}
            </div>
            <div className="hero-name" style={{ fontSize: 12, marginBottom: 6 }}>{company?.name || 'N/A'}</div>
            <div className="hero-meta" style={{ fontSize: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {company?.sector && <span style={{ color: 'var(--accent-primary)' }}>{company.sector}</span>}
              {company?.sector && company?.industry && <span style={{ color: 'var(--text-dim)' }}>•</span>}
              {company?.industry && <span style={{ color: 'var(--text-dim)' }}>{company.industry}</span>}
              {company?.market_cap_cr && <><span style={{ color: 'var(--text-dim)' }}>•</span><span>MCap {fCr(company.market_cap_cr)}</span></>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="hero-price" style={{ fontSize: 22 }}>₹{(price?.current || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div className="hero-change" style={{ color: cc, fontSize: 12 }}>
              {isPos ? '↑' : '↓'} {(price?.ret1m || 0).toFixed(2)}% (1M)
            </div>
          </div>
        </div>
        
        {/* Quick Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: 10 }}>
            <span style={{ color: 'var(--text-dim)' }}>52W Low</span>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{price?.week52Low || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: 10 }}>
            <span style={{ color: 'var(--text-dim)' }}>52W High</span>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{price?.week52High || '—'}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 12 }}>
        {statCards.map(([l, v, c]) => (
          <div key={l} className="stat-card" style={{ padding: 10 }}>
            <div className="stat-label" style={{ fontSize: 9 }}>{l}</div>
            <div className={`stat-value ${c}`} style={{ fontSize: 16 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* 52W Range */}
      <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>52-Week Range</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>{rp}%</span>
        </div>
        <div className="progress-bar" style={{ height: 4 }}>
          <div className="progress-fill" style={{ width: `${rp}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--text-dim)' }}>
          <span>₹{price?.week52Low || '—'}</span>
          <span>₹{price?.week52High || '—'}</span>
        </div>
      </div>

      {/* Charts Section */}
      <SecHeader label="Charts" collapsed={collapsed.charts} onToggle={() => toggleSection('charts')} />
      {!collapsed.charts && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
          <div className="chart-panel">
            <div className="chart-title">Price Trend</div>
            <div style={{ height: 120 }}><PriceChart data={priceHistory || []} /></div>
          </div>
          <div className="chart-panel">
            <div className="chart-title">Quarterly</div>
            <div style={{ height: 120 }}><QuarterlyChart data={quarterly || []} /></div>
          </div>
          <div className="chart-panel">
            <div className="chart-title">Shareholding</div>
            <div style={{ height: 120 }}><DonutChart data={shareholding || {}} /></div>
          </div>
        </div>
      )}

      {/* Fundamental Score */}
      <SecHeader label="Fundamental" collapsed={collapsed.fundamental} onToggle={() => toggleSection('fundamental')} />
      {!collapsed.fundamental && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            <div className="panel" style={{ padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: gradeColor(f.grade) }}>{f.grade || '?'}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Grade</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{f.overallPct || 0}%</div>
            </div>
            <div className="panel" style={{ padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: beneishColor }}>{f.beneish?.score?.toFixed(1) || '—'}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Beneish</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{f.beneish?.verdict || 'N/A'}</div>
            </div>
            <div className="panel" style={{ padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: altmanColor }}>{f.altman?.score?.toFixed(1) || '—'}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Altman Z</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{f.altman?.verdict || 'N/A'}</div>
            </div>
          </div>
          <div className="grid-2" style={{ gap: 10 }}>
            {(f.scorecards || []).map(card => <ScoreCard key={card.category} card={card} collapsed={false} />)}
          </div>
        </>
      )}

      {/* Technical */}
      <SecHeader label="Technical" collapsed={collapsed.technical} onToggle={() => toggleSection('technical')} />
      {!collapsed.technical && (
        <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ minWidth: 60 }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Trend</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: trendCol }}>{t.trend || '—'}</div>
            </div>
            <div style={{ flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4 }}>Long {t.longPct || 50}%</div>
              <div className="progress-bar" style={{ height: 3 }}>
                <div className="progress-fill" style={{ width: `${t.longPct || 50}%` }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[['RSI', t.rsiVal], ['MACD', t.macdVerdict], ['ADX', t.adxVal]].map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center', minWidth: 40 }}>
                  <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>{k}</div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{v || '—'}</div>
                </div>
              ))}
            </div>
          </div>
          {t.narrative && <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>{t.narrative}</div>}
        </div>
      )}

      {/* Ownership */}
      <SecHeader label="Ownership" collapsed={collapsed.ownership} onToggle={() => toggleSection('ownership')} />
      {!collapsed.ownership && (
        <div className="grid-2" style={{ gap: 10, marginBottom: 12 }}>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Shareholding</div>
            {shareholding && Object.keys(shareholding).length > 0 ? (
              Object.entries(shareholding).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                  <span style={{ fontWeight: 600 }}>{v}%</span>
                </div>
              ))
            ) : <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>No data</div>}
          </div>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Quarterly</div>
            {quarterly?.length > 0 ? (
              [...quarterly].reverse().slice(0, 3).map((q, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontWeight: 600 }}>{q.quarter || ''}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>₹{fN(q.revenue, '', 'Cr', 0)}</span>
                  <span style={{ color: 'var(--gain)' }}>₹{fN(q.net_profit, '', 'Cr', 0)}</span>
                </div>
              ))
            ) : <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>No data</div>}
          </div>
        </div>
      )}

      {/* Dividends */}
      {dividends?.has_dividends && (
        <>
          <SecHeader label="Dividends" collapsed={collapsed.dividends} onToggle={() => toggleSection('dividends')} />
          {!collapsed.dividends && (
            <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Frequency</div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{dividends.payout_frequency || 'N/A'}</div>
                </div>
                {dividends.avg_yield && (
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Yield</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gain)' }}>{(dividends.avg_yield * 100).toFixed(2)}%</div>
                  </div>
                )}
              </div>
              {dividends.track_record?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {dividends.track_record.slice(0, 3).map((d, i) => (
                    <span key={i} style={{ fontSize: 10, padding: '3px 6px', background: 'var(--bg-tertiary)', borderRadius: 4 }}>₹{d.amount}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}