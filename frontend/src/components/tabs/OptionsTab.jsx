import { useState, useEffect } from 'react'
import { useStore } from '../../store'

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
      <div className="empty-title">Select a stock first</div>
    </div>
  )

  if (!backendLive) return (
    <div className="empty-state">
      <div className="empty-icon">☷</div>
      <div className="empty-title">Backend offline</div>
    </div>
  )

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div className="empty-title">Loading...</div>
    </div>
  )

  if (error || !optionsData) return (
    <div className="empty-state">
      <div className="empty-icon">☷</div>
      <div className="empty-title">Option data unavailable</div>
    </div>
  )

  const { current_price, expiry, strikes } = optionsData

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
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 10 }}>Option Chain</span>
          </div>
          <span style={{ fontSize: 11, padding: '6px 12px', background: 'var(--accent-dim)', color: 'var(--accent-primary)', borderRadius: 8, fontWeight: 600 }}>
            ₹{current_price} · {expiry}
          </span>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, textAlign: 'center' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th colSpan={4} style={{ padding: '10px 12px', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>CALLS</th>
              <th style={{ padding: '10px 12px', background: 'var(--bg-secondary)', color: 'var(--accent-primary)', fontWeight: 800 }}>STRIKE</th>
              <th colSpan={4} style={{ padding: '10px 12px', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>PUTS</th>
            </tr>
            <tr>
              <th style={{ padding: '8px', color: 'var(--text-dim)' }}>OI</th>
              <th style={{ padding: '8px', color: 'var(--text-dim)' }}>Chg</th>
              <th style={{ padding: '8px', color: 'var(--text-dim)' }}>IV</th>
              <th style={{ padding: '8px', color: 'var(--text-dim)', borderRight: '1px solid var(--border-subtle)' }}>LTP</th>
              <th style={{ padding: '8px', background: 'var(--bg-secondary)', color: 'var(--accent-primary)', fontWeight: 800 }}>PRICE</th>
              <th style={{ padding: '8px', color: 'var(--text-dim)', borderLeft: '1px solid var(--border-subtle)' }}>LTP</th>
              <th style={{ padding: '8px', color: 'var(--text-dim)' }}>IV</th>
              <th style={{ padding: '8px', color: 'var(--text-dim)' }}>Chg</th>
              <th style={{ padding: '8px', color: 'var(--text-dim)' }}>OI</th>
            </tr>
          </thead>
          <tbody>
            {strikes.map((s, i) => {
              const isITMCall = s.strike < current_price
              const isITMPut = s.strike > current_price
              const isATM = Math.abs(s.strike - current_price) < (strikes[1].strike - strikes[0].strike)

              return (
                <tr key={i} style={{ background: isATM ? 'var(--accent-dim)' : 'transparent' }}>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{s.call_oi.toLocaleString()}</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: s.call_oi_chg > 0 ? 'var(--gain)' : 'var(--loss)' }}>
                    {s.call_oi_chg > 0 ? '+' : ''}{s.call_oi_chg.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{s.call_iv}</td>
                  <td style={{ padding: '8px', fontWeight: 600, fontFamily: 'var(--font-mono)', borderRight: '1px solid var(--border-subtle)' }}>{s.call_ltp}</td>

                  <td style={{ padding: '8px', background: 'var(--bg-secondary)', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{s.strike}</td>

                  <td style={{ padding: '8px', fontWeight: 600, fontFamily: 'var(--font-mono)', borderLeft: '1px solid var(--border-subtle)' }}>{s.put_ltp}</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{s.put_iv}</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: s.put_oi_chg > 0 ? 'var(--gain)' : 'var(--loss)' }}>
                    {s.put_oi_chg > 0 ? '+' : ''}{s.put_oi_chg.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{s.put_oi.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}