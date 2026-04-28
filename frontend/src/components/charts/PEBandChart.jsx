import React from 'react'

export default function PEBandChart({ data, currentPE }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: 120, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-tertiary)',
        borderRadius: 8,
        color: 'var(--text-dim)',
        fontSize: 11
      }}>
        No price history available
      </div>
    )
  }

  const hasPE = currentPE != null && currentPE > 0 && !isNaN(currentPE)
  
  const prices = data.map(d => d.close)
  const minPrice = Math.min(...prices) * 0.9
  const maxPrice = Math.max(...prices) * 1.1
  const range = maxPrice - minPrice || 1
  
  const heightPercent = data.map(d => {
    const pct = 100 - ((d.close - minPrice) / range) * 100
    return Math.max(2, Math.min(98, pct))
  })

  return (
    <div style={{ width: '100%', height: 120, position: 'relative', background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 6, left: 8, fontSize: 9, color: 'var(--text-dim)', zIndex: 10, display: 'flex', gap: 8 }}>
        <span style={{ color: hasPE ? 'var(--accent-primary)' : 'var(--text-dim)' }}>
          P/E: {hasPE ? currentPE.toFixed(1) + 'x' : 'N/A'}
        </span>
        <span style={{ color: 'var(--text-dim)' }}>| {data.length}D</span>
      </div>
      
      <svg width="100%" height="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Background bands if PE exists */}
        {hasPE && (
          <g>
            <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
            <line x1="0%" y1="30%" x2="100%" y2="30%" stroke="var(--loss)" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
            <line x1="0%" y1="70%" x2="100%" y2="70%" stroke="var(--gain)" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
            <text x="98%" y="31%" fill="var(--loss)" fontSize="7" textAnchor="end">+20%</text>
            <text x="98%" y="71%" fill="var(--gain)" fontSize="7" textAnchor="end">-20%</text>
          </g>
        )}
        
        {/* Area under the line */}
        <path
          d={`M0,100 ${heightPercent.map((y, i) => `L${(i / (data.length - 1)) * 100}%,${y}%`).join(' ')} L100%,100 Z`}
          fill="url(#priceGradient)"
        />
        
        {/* Price line */}
        <polyline
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={heightPercent.map((y, i) => `${(i / (data.length - 1)) * 100}%,${y}%`).join(' ')}
        />
      </svg>
      
      {/* Y-axis labels */}
      <div style={{ position: 'absolute', right: 4, top: 20, fontSize: 7, color: 'var(--text-dim)', background: 'rgba(0,0,0,0.3)', padding: '1px 3px', borderRadius: 2 }}>
        ₹{Math.round(maxPrice)}
      </div>
      <div style={{ position: 'absolute', right: 4, bottom: 4, fontSize: 7, color: 'var(--text-dim)', background: 'rgba(0,0,0,0.3)', padding: '1px 3px', borderRadius: 2 }}>
        ₹{Math.round(minPrice)}
      </div>
    </div>
  )
}