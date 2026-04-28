import { fN, fCr, gradeColor, vc, scoreColor } from '../../utils'
import { PriceChart, QuarterlyChart, DonutChart, ScoreRadar } from '../charts'
import { useStore } from '../../store'

const SecHeader = ({ label, children }) => (
  <div className="section-header">
    <span className="section-title">{label}</span>
    <div className="section-line" />
    {children}
  </div>
)

function ScoreCard({ card }) {
  const bc = scoreColor(card.score, card.max_score)
  return (
    <div className="panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{card.category}</span>
        <div className="progress-bar" style={{ width: 70 }}>
          <div className="progress-fill" style={{ width: `${card.score / card.max_score * 100}%`, background: bc }} />
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{card.score}/{card.max_score}</span>
      </div>
      {card.narrative && <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>{card.narrative}</p>}
      <table className="data-table"><tbody>
        {(card.signals || []).map(([n, v, vr], i) => (
          <tr key={i}><td style={{ padding: '8px 0', color: 'var(--text-tertiary)' }}>{n}</td><td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{v}</td><td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }} className={vc(vr)}>{vr}</td></tr>
        ))}
      </tbody></table>
    </div>
  )
}

export default function Overview({ data }) {
  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">◈</div>
      <div className="empty-title">Select a stock to analyze</div>
      <div className="empty-hint">Search and add stocks from the sidebar</div>
    </div>
  )

  const { company, price, ratios, fundamental, technical, shareholding, quarterly, aceInvestors, promoterHistory, priceHistory, dividends } = data
  const r = ratios || {}
  const f = fundamental || {}
  const t = technical || {}
  const isPos = (price?.ret1m || 0) >= 0
  const cc = isPos ? 'var(--gain)' : 'var(--loss)'
  const rp = ((((price?.current || 0) - (price?.week52Low || 0)) / ((price?.week52High || 1) - (price?.week52Low || 0))) * 100).toFixed(1)
  const beneishColor = f.beneish?.score < -2.22 ? 'var(--gain)' : f.beneish?.score < -1.78 ? 'var(--warning)' : 'var(--loss)'
  const altmanColor = f.altman?.score > 2.99 ? 'var(--gain)' : f.altman?.score > 1.81 ? 'var(--warning)' : 'var(--loss)'
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
    <div>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-left">
          <div className="hero-ticker">{data.symbol}</div>
          <div className="hero-name">{company?.name}</div>
          <div className="hero-meta">
            <span>{company?.sector}</span>
            <span>|</span>
            <span>{company?.industry}</span>
            <span>|</span>
            <span>MCap {fCr(company?.market_cap_cr)}</span>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-price">₹{(price?.current || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          <div className="hero-change" style={{ color: cc }}>
            {isPos ? '↑' : '↓'} {(price?.ret1m || 0).toFixed(2)}% (1M)
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4">
        {statCards.map(([l, v, c]) => (
          <div key={l} className="stat-card">
            <div className="stat-label">{l}</div>
            <div className={`stat-value ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <SecHeader label="Analysis Overview" />
      <div className="grid-3">
        <div className="chart-panel">
          <div className="chart-title">Price Trend (60D)</div>
          <div style={{ height: 180 }}><PriceChart data={priceHistory || []} /></div>
        </div>
        <div className="chart-panel">
          <div className="chart-title">Quarterly Performance</div>
          <div style={{ height: 180 }}><QuarterlyChart data={quarterly || []} /></div>
        </div>
        <div className="chart-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-title">Shareholding</div>
          <div style={{ height: 180, width: '100%' }}><DonutChart data={shareholding || {}} /></div>
        </div>
      </div>

      {/* Business Description */}
      {company?.description && (
        <div className="panel">
          <div className="panel-title">Business Description</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{company.description}</p>
        </div>
      )}

      {/* 52W Range */}
      <div className="panel">
        <div className="panel-title">52-Week Range</div>
        <div style={{ marginTop: 12 }}>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${rp}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>LOW</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{price?.week52Low || '—'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--accent-primary)' }}>CURRENT</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-primary)' }}>{rp}%</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>HIGH</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{price?.week52High || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fundamental Analysis */}
      <SecHeader label="Buffett & RJ Analysis">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 800, color: gradeColor(f.grade) }}>{f.grade || '?'}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>{f.overallPct || 0}% Score</div>
        </div>
      </SecHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="panel-title">Score Breakdown</div>
          <ScoreRadar scorecards={f.scorecards || []} />
        </div>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(f.scorecards || []).map(c => (
            <div key={c.category} className="score-row">
              <span className="score-label" style={{ fontSize: 11 }}>{c.category}</span>
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${c.score / c.max_score * 100}%`, background: scoreColor(c.score, c.max_score) }} />
              </div>
              <span className="score-value">{c.score}/{c.max_score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {(f.scorecards || []).map(card => <ScoreCard key={card.category} card={card} />)}
      </div>

      {/* Financial Integrity */}
      <SecHeader label="Financial Integrity & Risk" />
      <div className="grid-2">
        <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 800, color: beneishColor }}>{(f.beneish?.score || 0).toFixed(2)}</div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Beneish M-Score</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.beneish?.verdict || 'Not available'}</div>
          </div>
        </div>
        <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 800, color: altmanColor }}>{(f.altman?.score || 0).toFixed(1)}</div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Altman Z-Score</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.altman?.verdict || 'Not available'}</div>
          </div>
        </div>
      </div>

      {/* Technical Analysis */}
      <SecHeader label="Technical Market Stance" />
      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Market Trend</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: trendCol, marginTop: 4 }}>{t.trend || '—'}</div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6 }}>
              <span>LONG {t.longPct || 50}%</span><span>SHORT {100 - (t.longPct || 50)}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${t.longPct || 50}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['RSI', t.rsiVal], ['MACD', t.macdVerdict], ['ADX', t.adxVal]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>
        {t.narrative && <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>{t.narrative}</div>}
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Market Signals</div>
          <table className="data-table"><tbody>
            {(t.signals || []).map(([n, v, vr, cl], i) => (
              <tr key={i}><td style={{ padding: '10px 0', color: 'var(--text-tertiary)' }}>{n}</td><td style={{ padding: '10px 10px', fontWeight: 600 }}>{v}</td><td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }} className={cl || vc(vr)}>{vr}</td></tr>
            ))}
          </tbody></table>
        </div>
        <div className="panel">
          <div className="panel-title">Support & Resistance</div>
          <table className="data-table"><tbody>
            <tr><td style={{ padding: '10px 0', color: 'var(--text-tertiary)' }}>Support (50D)</td><td style={{ padding: '10px 10px', fontWeight: 600 }}>₹{t.supportResistance?.support_50d || '—'}</td><td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--gain)' }}>Floor</td></tr>
            <tr><td style={{ padding: '10px 0', color: 'var(--text-tertiary)' }}>Resistance (50D)</td><td style={{ padding: '10px 10px', fontWeight: 600 }}>₹{t.supportResistance?.resistance_50d || '—'}</td><td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-dim)' }}>Ceiling</td></tr>
            <tr><td style={{ padding: '10px 0', color: 'var(--text-tertiary)' }}>Volume vs Avg</td><td style={{ padding: '10px 10px', fontWeight: 600 }}>{t.volumeAnalysis?.ratio || '—'}x</td><td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }} className={vc(t.volumeAnalysis?.verdict || '')}>{t.volumeAnalysis?.verdict || '—'}</td></tr>
          </tbody></table>
        </div>
      </div>

      {/* Ownership */}
      <SecHeader label="Ownership & Quarterly" />
      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Shareholding Distribution</div>
          <table className="data-table"><tbody>
            {Object.entries(shareholding || {}).map(([k, v]) => (
              <tr key={k}><td style={{ padding: '10px 0', color: 'var(--text-tertiary)' }}>{k.charAt(0).toUpperCase() + k.slice(1)}</td><td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}%</td><td style={{ padding: '10px 0', textAlign: 'right', color: k === 'promoter' ? 'var(--gain)' : 'var(--text-dim)' }}>●</td></tr>
            ))}
          </tbody></table>
          {promoterHistory?.length >= 2 && (
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Promoter:</span>
              <span style={{ fontWeight: 700, color: promoterHistory[0]?.pct > promoterHistory[promoterHistory.length - 1]?.pct ? 'var(--gain)' : 'var(--loss)' }}>
                {promoterHistory[0]?.pct > promoterHistory[promoterHistory.length - 1]?.pct ? '↑' : '↓'}
              </span>
            </div>
          )}
          {aceInvestors?.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {aceInvestors.map(a => <span key={a} className="badge" style={{ background: 'var(--accent-secondary-dim)', color: 'var(--accent-secondary)' }}>{a}</span>)}
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-title">Quarterly Trends</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ fontSize: 10, padding: '8px 10px' }}>QTR</th>
                <th style={{ fontSize: 10, padding: '8px 10px' }}>REV</th>
                <th style={{ fontSize: 10, padding: '8px 10px' }}>NP</th>
                <th style={{ fontSize: 10, padding: '8px 10px', textAlign: 'right' }}>OPM%</th>
              </tr>
            </thead>
            <tbody>
              {[...(quarterly || [])].reverse().slice(0, 5).map((q, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{q.quarter || ''}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{fN(q.revenue, '₹', 'Cr', 0)}</td>
                  <td style={{ color: 'var(--gain)', fontFamily: 'var(--font-mono)' }}>{fN(q.net_profit, '₹', 'Cr', 1)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fN(q.opm, '', '%', 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dividends */}
      {dividends?.has_dividends && (
        <div className="panel">
          <div className="panel-title">Dividend History (Buffett Indicator)</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Frequency</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{dividends.payout_frequency}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>5Y Avg</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>₹{dividends.avg_payout_5y}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Yield</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gain)' }}>{(r.dividend_yield * 100).toFixed(2)}%</div>
            </div>
          </div>
          <table className="data-table">
            <thead><tr><th style={{ fontSize: 10 }}>Date</th><th style={{ fontSize: 10, textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {(dividends.track_record || []).slice(0, 5).map((d, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-dim)' }}>{d.date}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--gain)' }}>₹{d.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}