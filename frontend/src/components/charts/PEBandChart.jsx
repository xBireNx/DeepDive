import React from 'react'

export default function PEBandChart({ data, currentPE }) {
  if (!data || data.length === 0 || !currentPE) return <div className="empty-state" style={{height: 150}}>No data for P/E Band</div>

  // We approximate the P/E bands by assuming current P/E is the 0-line,
  // and creating +/- 20% bands around the price history to visualize median bands.
  // Real implementation would need historical EPS data per quarter.
  
  const minPrice = Math.min(...data.map(d => d.low)) * 0.8
  const maxPrice = Math.max(...data.map(d => d.high)) * 1.2
  
  return (
    <div style={{ width: '100%', height: 250, display: 'flex', alignItems: 'flex-end', gap: 2, paddingTop: 20, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, fontSize: 10, color: 'var(--muted)' }}>
        Current P/E: {currentPE.toFixed(1)}x (Mocked ±20% Bands based on price action)
      </div>
      
      {/* Background bands */}
      <div style={{ position: 'absolute', top: '10%', bottom: '10%', width: '100%', background: 'rgba(56, 189, 248, 0.05)', borderTop: '1px dashed rgba(56, 189, 248, 0.3)', borderBottom: '1px dashed rgba(56, 189, 248, 0.3)' }} />
      <div style={{ position: 'absolute', top: '30%', bottom: '30%', width: '100%', background: 'rgba(34, 197, 94, 0.05)', borderTop: '1px dashed rgba(34, 197, 94, 0.3)', borderBottom: '1px dashed rgba(34, 197, 94, 0.3)' }} />
      
      {/* Price line */}
      <svg width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <polyline
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2"
          points={data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100
            const y = 100 - ((d.close - minPrice) / (maxPrice - minPrice)) * 100
            return `${x}%,${y}%`
          }).join(' ')}
        />
      </svg>
    </div>
  )
}
