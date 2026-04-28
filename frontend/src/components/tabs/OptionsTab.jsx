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

  if (!data) return <div className="empty-state">Select a stock first</div>
  if (!backendLive) return <div className="empty-state">Backend offline</div>
  if (loading) return <div className="empty-state">Loading Option Chain...</div>
  if (error || !optionsData) return <div className="empty-state">Could not load Option Chain</div>

  const { current_price, expiry, strikes } = optionsData

  return (
    <div className="tab-pane fade-in">
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 2 }}>Option Chain (Mocked for Demo)</h3>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Expiry: {expiry} · Underlying: ₹{current_price}</div>
          </div>
          <div style={{ background: 'var(--bg-lighter)', padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
            Spot Price: <span style={{ color: 'var(--brand)' }}>{current_price}</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="comparison-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'var(--bg-lighter)' }}>
                <th colSpan={4} style={{ borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', padding: '8px' }}>CALLS</th>
                <th style={{ borderBottom: '1px solid var(--border)', padding: '8px' }}>STRIKE</th>
                <th colSpan={4} style={{ borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', padding: '8px' }}>PUTS</th>
              </tr>
              <tr>
                <th style={thStyle}>OI</th>
                <th style={thStyle}>Chng in OI</th>
                <th style={thStyle}>IV</th>
                <th style={{...thStyle, borderRight: '1px solid var(--border)'}}>LTP</th>
                <th style={{...thStyle, background: 'var(--bg4)'}}>PRICE</th>
                <th style={{...thStyle, borderLeft: '1px solid var(--border)'}}>LTP</th>
                <th style={thStyle}>IV</th>
                <th style={thStyle}>Chng in OI</th>
                <th style={thStyle}>OI</th>
              </tr>
            </thead>
            <tbody>
              {strikes.map((s, i) => {
                const isITMCall = s.strike < current_price
                const isITMPut = s.strike > current_price
                const isATM = Math.abs(s.strike - current_price) < (strikes[1].strike - strikes[0].strike)
                
                return (
                  <tr key={i} style={{ background: isATM ? 'rgba(56, 189, 248, 0.1)' : 'transparent' }}>
                    <td style={{...tdStyle, background: isITMCall ? 'rgba(255,255,255,0.02)' : 'transparent'}}>{s.call_oi.toLocaleString()}</td>
                    <td style={{...tdStyle, color: s.call_oi_chg > 0 ? 'var(--green)' : 'var(--red)', background: isITMCall ? 'rgba(255,255,255,0.02)' : 'transparent'}}>{s.call_oi_chg > 0 ? '+' : ''}{s.call_oi_chg.toLocaleString()}</td>
                    <td style={{...tdStyle, background: isITMCall ? 'rgba(255,255,255,0.02)' : 'transparent'}}>{s.call_iv}</td>
                    <td style={{...tdStyle, fontWeight: 600, borderRight: '1px solid var(--border)', background: isITMCall ? 'rgba(255,255,255,0.02)' : 'transparent'}}>{s.call_ltp}</td>
                    
                    <td style={{...tdStyle, background: 'var(--bg4)', fontWeight: 700, color: 'var(--brand)'}}>{s.strike}</td>
                    
                    <td style={{...tdStyle, fontWeight: 600, borderLeft: '1px solid var(--border)', background: isITMPut ? 'rgba(255,255,255,0.02)' : 'transparent'}}>{s.put_ltp}</td>
                    <td style={{...tdStyle, background: isITMPut ? 'rgba(255,255,255,0.02)' : 'transparent'}}>{s.put_iv}</td>
                    <td style={{...tdStyle, color: s.put_oi_chg > 0 ? 'var(--green)' : 'var(--red)', background: isITMPut ? 'rgba(255,255,255,0.02)' : 'transparent'}}>{s.put_oi_chg > 0 ? '+' : ''}{s.put_oi_chg.toLocaleString()}</td>
                    <td style={{...tdStyle, background: isITMPut ? 'rgba(255,255,255,0.02)' : 'transparent'}}>{s.put_oi.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const thStyle = {
  padding: '8px 10px',
  borderBottom: '2px solid var(--border)',
  color: 'var(--muted)',
  fontSize: 10,
  fontWeight: 600
}

const tdStyle = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--b2)',
  fontFamily: 'monospace'
}
