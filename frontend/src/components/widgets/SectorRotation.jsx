import { useState, useEffect } from 'react'
import { api } from '../../store'

export default function SectorRotation() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    const fetchSectors = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${api}/sector-rotation`)
        const json = await res.json()
        if (json.ok && active) setData(json.results)
      } catch (e) {
        if (active) setError(e.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchSectors()
    return () => { active = false }
  }, [])

  if (loading) return <div className="card"><div className="card-title">Sector Rotation</div><div style={{color:'var(--muted)', fontSize: 12}}>Loading sector data...</div></div>
  if (error || !data) return null

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-title">Sector Rotation (1M / 3M Momentum)</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
        Track which sectors institutional money is moving into or out of.
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {data.map(s => {
          const isBull = s.trend === 'Bullish'
          const isBear = s.trend === 'Bearish'
          const bg = isBull ? 'rgba(34, 197, 94, 0.1)' : isBear ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-lighter)'
          const border = isBull ? '1px solid rgba(34, 197, 94, 0.3)' : isBear ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)'
          const textCol = isBull ? 'var(--up)' : isBear ? 'var(--down)' : 'inherit'

          return (
            <div key={s.sector} style={{ flex: '1 1 120px', padding: 12, borderRadius: 6, background: bg, border }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{s.sector}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: textCol, marginBottom: 2 }}>{s.ret_1m > 0 ? '+' : ''}{s.ret_1m}% <span style={{fontSize: 9, fontWeight: 'normal'}}>1M</span></div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.ret_3m > 0 ? '+' : ''}{s.ret_3m}% <span style={{fontSize: 9}}>3M</span></div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', marginTop: 6, color: textCol, fontWeight: 600 }}>{s.trend}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
