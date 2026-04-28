import { useState } from 'react'
import { fN } from '../../utils'
import { OPMChart, RelativeReturnChart, PEBandChart } from '../charts'

const SecHeader = ({ label, collapsed, onToggle }) => (
  <div className="section-header" onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 10, marginTop: 16 }}>
    <span className="section-title">{label}</span>
    <div className="section-line" style={{ flex: 1 }} />
    {onToggle && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{collapsed ? '▼' : '▲'}</span>}
  </div>
)

export default function Advanced({ data }) {
  const [collapsed, setCollapsed] = useState({})
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">⊗</div>
      <div className="empty-title">Select a stock first</div>
    </div>
  )

  const dp = data.dupont || {}
  const wc = data.wcTrend || {}
  const rr = data.relativeReturn || {}
  const rf = data.redFlags || []
  const ptx = data.promoterTx || []
  const cur = dp.current || {}
  const ptxMax = ptx.length ? Math.max(...ptx.map(t => t.pct || 0)) : 100

  const getAlphaColor = (val) => val > 0 ? 'var(--gain)' : val < 0 ? 'var(--loss)' : 'var(--text-dim)'
  const getFlagColor = (sev) => sev === 'HIGH' ? 'var(--loss)' : sev === 'MEDIUM' ? 'var(--warning)' : 'var(--gain)'
  const getBeatColor = (pct) => pct > 0 ? 'var(--gain)' : pct < 0 ? 'var(--loss)' : 'var(--text-dim)'

  return (
    <div style={{ padding: '0 0 20px 0' }}>
      {/* Header */}
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
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>Advanced Analysis</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(rf.filter(f => f.severity === 'HIGH').length > 0) && (
              <span style={{ fontSize: 10, padding: '4px 8px', background: 'var(--loss-dim)', color: 'var(--loss)', borderRadius: 6, fontWeight: 700 }}>
                ⚠ {rf.filter(f => f.severity === 'HIGH').length} Flags
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Earnings History */}
      {(data.earningsHistory || []).length > 0 && (
        <>
          <SecHeader label="Earnings Beat History" collapsed={collapsed.earnings} onToggle={() => toggleSection('earnings')} />
          {!collapsed.earnings && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
              {data.earningsHistory.map((e, i) => (
                <div key={i} style={{ 
                  minWidth: 100, 
                  padding: 12, 
                  borderRadius: 10, 
                  background: e.surprise_pct > 0 ? 'var(--gain-dim)' : e.surprise_pct < 0 ? 'var(--loss-dim)' : 'var(--bg-tertiary)', 
                  border: `1px solid ${e.surprise_pct > 0 ? 'var(--gain)' : e.surprise_pct < 0 ? 'var(--loss)' : 'var(--border-default)'}30`,
                  flexShrink: 0
                }}>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4 }}>{e.date}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: getBeatColor(e.surprise_pct) }}>
                    {e.surprise_pct > 0 ? '+' : ''}{e.surprise_pct}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* DuPont Analysis */}
      <SecHeader label="DuPont ROE Analysis" collapsed={collapsed.dupont} onToggle={() => toggleSection('dupont')} />
      {!collapsed.dupont && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              ['Net Margin', `${cur.netMargin || '—'}%`, 'var(--gain)'],
              ['Asset T/O', `${cur.assetTurnover || '—'}x`, 'var(--accent-secondary)'],
              ['Eq. Multiplier', `${cur.equityMultiplier || '—'}x`, '#a855f7']
            ].map(([l, v, c]) => (
              <div key={l} className="panel" style={{ padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: c, fontFamily: 'var(--font-mono)' }}>{v}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          {dp.insight && (
            <div className="panel" style={{ padding: 10, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {dp.insight}
            </div>
          )}
          {(dp.trend || []).length > 0 && (
            <div className="panel" style={{ padding: 10 }}>
              <div style={{ display: 'flex', gap: 6, fontSize: 9, color: 'var(--text-dim)', marginBottom: 6 }}>
                <span style={{ width: 40 }}>Year</span>
                <span style={{ flex: 1 }}>Net Margin</span>
                <span style={{ flex: 1 }}>Asset T/O</span>
                <span style={{ width: 50, textAlign: 'right' }}>ROE</span>
              </div>
              {(dp.trend || []).map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', width: 40 }}>{t.year}</span>
                  <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${Math.min(t.netMargin / 40 * 100, 100)}%`, background: 'var(--gain)', borderRadius: 2 }} />
                  </div>
                  <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${Math.min(t.assetTurnover / 3 * 100, 100)}%`, background: 'var(--accent-secondary)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.roe > 15 ? 'var(--gain)' : 'var(--warning)', width: 50, textAlign: 'right' }}>{t.roe}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Red Flags */}
      {rf.length > 0 && (
        <>
          <SecHeader label="Red Flags" collapsed={collapsed.flags} onToggle={() => toggleSection('flags')} />
          {!collapsed.flags && (
            <div style={{ marginBottom: 12 }}>
              {rf.map((f, i) => (
                <div key={i} style={{ 
                  display: 'flex', alignItems: 'center', gap: 10, 
                  padding: 10, marginBottom: 8, 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-default)', 
                  borderRadius: 10,
                  borderLeft: `3px solid ${getFlagColor(f.severity)}`
                }}>
                  <span style={{ fontSize: 16 }}>{f.severity === 'HIGH' ? '⚠' : f.severity === 'MEDIUM' ? '◈' : '✓'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: getFlagColor(f.severity) }}>{f.flag}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{f.detail}</div>
                  </div>
                  <span className="badge" style={{ 
                    background: `${getFlagColor(f.severity)}20`, 
                    color: getFlagColor(f.severity),
                    fontSize: 9
                  }}>{f.severity}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Relative Return */}
      <SecHeader label="vs Nifty 50" collapsed={collapsed.returns} onToggle={() => toggleSection('returns')} />
      {!collapsed.returns && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {Object.entries(rr.periods || {}).map(([period, d]) => (
              <div key={period} className="panel" style={{ padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{period}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: d.stock >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                  {d.stock != null ? `${d.stock >= 0 ? '+' : ''}${d.stock}%` : '—'}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>Nifty {d.nifty != null ? `${d.nifty >= 0 ? '+' : ''}${d.nifty}%` : '—'}</div>
                {d.alpha != null && (
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, padding: '2px 6px', borderRadius: 4, background: `${getAlphaColor(d.alpha)}20`, color: getAlphaColor(d.alpha) }}>
                    α {d.alpha >= 0 ? '+' : ''}{d.alpha}%
                  </div>
                )}
              </div>
            ))}
          </div>
          {rr.insight && (
            <div className="panel" style={{ padding: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
              {rr.outperforming ? '🟢' : '🔴'} {rr.insight}
            </div>
          )}
          {(rr.niftyHistory || []).length > 0 ? (
            <div style={{ marginTop: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Stock vs Nifty (60D)</div>
              <div style={{ width: '100%', height: 130 }}><RelativeReturnChart priceHistory={data.priceHistory || []} niftyHistory={rr.niftyHistory || []} symbol={data.symbol} /></div>
            </div>
          ) : (
            <div style={{ marginTop: 10, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, textAlign: 'center', color: 'var(--text-dim)', fontSize: 10 }}>
              Nifty comparison data not available
            </div>
          )}
        </div>
      )}

      {/* PE Band */}
      <SecHeader label="P/E Band" collapsed={collapsed.peband} onToggle={() => toggleSection('peband')} />
      {!collapsed.peband && (
        <div style={{ marginBottom: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Price Action (60D)</div>
          <div style={{ width: '100%', height: 130 }}>
            <PEBandChart data={data.priceHistory || []} currentPE={data.ratios?.pe} />
          </div>
        </div>
      )}

      {/* Working Capital */}
      <SecHeader label="Working Capital" collapsed={collapsed.wc} onToggle={() => toggleSection('wc')} />
      {!collapsed.wc && (
        <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="panel" style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Quarterly</div>
            {(wc.trend || []).length > 0 ? (
              <div>
                {wc.trend.slice(0, 4).map((q, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontWeight: 600 }}>{q.quarter || ''}</span>
                    <span style={{ color: 'var(--gain)' }}>₹{fN(q.revenue, '', 'Cr', 0)}</span>
                    <span style={{ color: q.revenueGrowthQoQ >= 0 ? 'var(--gain)' : 'var(--loss)' }}>{q.revenueGrowthQoQ != null ? `${q.revenueGrowthQoQ >= 0 ? '+' : ''}${q.revenueGrowthQoQ}%` : '—'}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>No data</div>}
          </div>
          <div className="chart-panel">
            <div className="chart-title">OPM Trend</div>
            <div style={{ height: 100 }}><OPMChart data={wc.trend || []} /></div>
          </div>
        </div>
      )}

      {/* Promoter Holdings */}
      <SecHeader label="Promoter Holdings" collapsed={collapsed.promoter} onToggle={() => toggleSection('promoter')} />
      {!collapsed.promoter && (
        <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="panel" style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>History</div>
            {ptx.length > 0 ? (
              ptx.slice(0, 6).map((t, i) => {
                const prev = ptx[i + 1]
                const chg = prev ? (t.pct - prev.pct).toFixed(1) : null
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', width: 50 }}>{t.quarter || ''}</span>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${(t.pct / ptxMax * 100).toFixed(0)}%`, background: 'var(--gain)', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gain)', width: 35, textAlign: 'right' }}>{t.pct}%</span>
                  </div>
                )
              })
            ) : <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>No data</div>}
          </div>
          <div className="panel" style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Signal</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <div><span style={{ color: 'var(--gain)' }}>↑</span> Bullish - buying</div>
              <div><span style={{ color: 'var(--text-dim)' }}>→</span> Neutral</div>
              <div><span style={{ color: 'var(--loss)' }}>↓</span> Warning - selling</div>
            </div>
          </div>
        </div>
      )}

      {/* Altman Z-Score - show if we have any data */}
      {(data.altmanZ || data.altmanZ?.zone) && (
        <>
          <SecHeader label="Altman Z-Score" collapsed={collapsed.altman} onToggle={() => toggleSection('altman')} />
          {!collapsed.altman && (
            <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="panel" style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: data.altmanZ?.zone === 'Safe' ? 'var(--gain)' : data.altmanZ?.zone === 'Grey' ? 'var(--warning)' : data.altmanZ?.zone === 'Distress' ? 'var(--loss)' : 'var(--text-dim)' }}>
                  {data.altmanZ?.score ?? '—'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Z-Score</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: data.altmanZ?.zone === 'Safe' ? 'var(--gain)' : data.altmanZ?.zone === 'Grey' ? 'var(--warning)' : data.altmanZ?.zone === 'Distress' ? 'var(--loss)' : 'var(--text-dim)' }}>
                  {data.altmanZ?.zone ?? 'Unknown'}
                </div>
              </div>
              <div className="panel" style={{ padding: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Interpretation</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.altmanZ?.detail || 'Insufficient financial data for Z-Score calculation'}
                </div>
                <div style={{ marginTop: 10, fontSize: 9, color: 'var(--text-dim)' }}>
                  <span style={{ color: 'var(--gain)' }}>Safe</span> &gt; 3 | 
                  <span style={{ color: 'var(--warning)' }}> Grey</span> 1.1-3 | 
                  <span style={{ color: 'var(--loss)' }}> Distress</span> &lt; 1.1
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* FII/DII Holdings - show if we have any data */}
      {(data.fiiDii?.fii?.length > 0 || data.fiiDii?.dii?.length > 0) && (
        <>
          <SecHeader label="FII / DII Holdings" collapsed={collapsed.fii} onToggle={() => toggleSection('fii')} />
          {!collapsed.fii && (
            <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
              {data.fiiDii?.insight && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>{data.fiiDii.insight}</div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>FII</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {data.fiiDii?.fii?.[0]?.pct ?? 0}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>DII</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gain)' }}>
                    {data.fiiDii?.dii?.[0]?.pct ?? 0}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Key Ratios */}
      {data.ratiosSummary && Object.keys(data.ratiosSummary).length > 0 && (
        <>
          <SecHeader label="Key Ratios" collapsed={collapsed.ratios} onToggle={() => toggleSection('ratios')} />
          {!collapsed.ratios && (
            <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.entries(data.ratiosSummary).map(([cat, vals]) => (
                <div key={cat} className="panel" style={{ padding: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>{cat}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {Object.entries(vals).filter(([, v]) => v != null).slice(0, 4).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span style={{ color: 'var(--text-dim)' }}>{k.replace('_', ' ')}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {typeof v === 'number' ? (v > 1 ? v.toFixed(1) : (v * 100).toFixed(1) + '%') : v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Cash Flow */}
      {data.cashFlow?.insight && (
        <>
          <SecHeader label="Cash Flow" collapsed={collapsed.cf} onToggle={() => toggleSection('cf')} />
          {!collapsed.cf && (
            <div className="panel" style={{ padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {data.cashFlow.insight}
              </div>
              {data.cashFlow.operating != null && (
                <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10 }}>
                  <span>Operating: <span style={{ fontWeight: 700, color: data.cashFlow.operating > 0 ? 'var(--gain)' : 'var(--loss)' }}>
                    {data.cashFlow.operating > 0 ? '+' : ''}{Math.round(data.cashFlow.operating)} Cr
                  </span></span>
                  {data.cashFlow.investing != null && (
                    <span>Investing: <span style={{ fontWeight: 700, color: data.cashFlow.investing > 0 ? 'var(--gain)' : 'var(--loss)' }}>
                      {data.cashFlow.investing > 0 ? '+' : ''}{Math.round(data.cashFlow.investing)} Cr
                    </span></span>
                  )}
                  {data.cashFlow.financing != null && (
                    <span>Financing: <span style={{ fontWeight: 700, color: data.cashFlow.financing > 0 ? 'var(--gain)' : 'var(--loss)' }}>
                      {data.cashFlow.financing > 0 ? '+' : ''}{Math.round(data.cashFlow.financing)} Cr
                    </span></span>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Bulk Deals */}
      {data.bulkDeals?.length > 0 && (
        <>
          <SecHeader label="Bulk / Block Deals" collapsed={collapsed.bulk} onToggle={() => toggleSection('bulk')} />
          {!collapsed.bulk && (
            <div className="panel" style={{ padding: 0, marginBottom: 12, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)' }}>
                    {['Date', 'Type', 'Qty', 'Price', 'Value'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.bulkDeals.slice(0, 5).map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px 10px' }}>{d.date || '-'}</td>
                      <td style={{ padding: '8px 10px', color: d.type?.includes('Buy') ? 'var(--gain)' : 'var(--loss)' }}>{d.type || '-'}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{d.quantity ? Math.round(d.quantity).toLocaleString() : '-'}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{d.price ? '₹' + Math.round(d.price).toLocaleString() : '-'}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{d.value ? '₹' + Math.round(d.value / 1e7).toFixed(1) + ' Cr' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}