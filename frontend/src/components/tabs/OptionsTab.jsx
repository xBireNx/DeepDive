import { useState, useEffect } from 'react'
import { useStore } from '../../store'

const thStyle = {
  padding: '10px 12px',
  borderBottom: '2px solid var(--border)',
  color: 'var(--text-dim)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5
}

const tdStyle = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--border)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12
}

export default function OptionsTab({ data }) {
  const { backendLive } = useStore()
  const [optionsData, setOptionsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!data?.symbol || !backendLive) return
    let active = true

    const fetchOptions = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/options/${data.symbol}`)
        const json = await res.json()
        if (json.ok && active) setOptionsData(json.data)
      } catch (e) {
        if (active) setError(e.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchOptions()
    return () => { active = false }
  }, [data?.symbol, backendLive])

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon">☷</div>
      <div className="empty-text">Select a stock first</div>
    </div>
  )

  if (!backendLive) return (
    <div className="empty-state">
      <div className="empty-icon">☷</div>
      <div className="empty-text">Backend offline</div>
    </div>
  )

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <div className="loading-text">Loading Option Chain...</div>
    </div>
  )

  if (error || !optionsData) return (
    <div className="empty-state">
      <div className="empty-icon">☷</div>
      <div className="empty-text">Could not load Option Chain</div>
    </div>
  )

  const { current_price, expiry, strikes } = optionsData

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 className="card-title" style={{ marginBottom: 4 }}>Option Chain (Mocked for Demo)</h3>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Expiry: {expiry} · Underlying: ₹{current_price}</div>
        </div>
        <div style={{ background: 'var(--primary-glow)', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
          Spot: <span style={{ color: 'var(--primary)' }}>₹{current_price}</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 11 }}>
          <thead>
            <tr style={{ background: 'var(--surface-elevated)' }}>
              <th colSpan={4} style={{ ...thStyle, borderRight: '1px solid var(--border)', textAlign: 'center' }}>CALLS</th>
              <th style={{ ...thStyle, background: 'var(--surface-hover)', textAlign: 'center' }}>STRIKE</th>
              <th colSpan={4} style={{ ...thStyle, borderLeft: '1px solid var(--border)', textAlign: 'center' }}>PUTS</th>
            </tr>
            <tr>
              <th style={thStyle}>OI</th>
              <th style={thStyle}>Chng</th>
              <th style={thStyle}>IV</th>
              <th style={{ ...thStyle, borderRight: '1px solid var(--border)' }}>LTP</th>
              <th style={{ ...thStyle, background: 'var(--surface-hover)', fontWeight: 800, color: 'var(--primary)' }}>PRICE</th>
              <th style={{ ...thStyle, borderLeft: '1px solid var(--border)' }}>LTP</th>
              <th style={thStyle}>IV</th>
              <th style={thStyle}>Chng</th>
              <th style={thStyle}>OI</th>
            </tr>
          </thead>
          <tbody>
            {strikes.map((s, i) => {
              const isITMCall = s.strike < current_price
              const isITMPut = s.strike > current_price
              const isATM = Math.abs(s.strike - current_price) < (strikes[1].strike - strikes[0].strike)

              return (
                <tr key={i} style={{ background: isATM ? 'rgba(99, 102, 241, 0.08)' : 'transparent' }}>
                  <td style={{ ...tdStyle, background: isITMCall ? 'rgba(255,255,255,0.02)' : 'transparent' }}>{s.call_oi.toLocaleString()}</td>
                  <td style={{ ...tdStyle, color: s.call_oi_chg > 0 ? 'var(--success)' : 'var(--error)', background: isITMCall ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {s.call_oi_chg > 0 ? '+' : ''}{s.call_oi_chg.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, background: isITMCall ? 'rgba(255,255,255,0.02)' : 'transparent' }}>{s.call_iv}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, borderRight: '1px solid var(--border)', background: isITMCall ? 'rgba(255,255,255,0.02)' : 'transparent' }}>{s.call_ltp}</td>

                  <td style={{ ...tdStyle, background: 'var(--surface-hover)', fontWeight: 800, color: 'var(--primary)', fontSize: 13 }}>{s.strike}</td>

                  <td style={{ ...tdStyle, fontWeight: 600, borderLeft: '1px solid var(--border)', background: isITMPut ? 'rgba(255,255,255,0.02)' : 'transparent' }}>{s.put_ltp}</td>
                  <td style={{ ...tdStyle, background: isITMPut ? 'rgba(255,255,255,0.02)' : 'transparent' }}>{s.put_iv}</td>
                  <td style={{ ...tdStyle, color: s.put_oi_chg > 0 ? 'var(--success)' : 'var(--error)', background: isITMPut ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {s.put_oi_chg > 0 ? '+' : ''}{s.put_oi_chg.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, background: isITMPut ? 'rgba(255,255,255,0.02)' : 'transparent' }}>{s.put_oi.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}