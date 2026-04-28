// Format number with Indian locale
export const fN = (v, pre = '', suf = '', d = 1) => {
  if (v === null || v === undefined || v === 'N/A') return 'N/A'
  if (typeof v === 'string') return v
  const n = parseFloat(v)
  if (isNaN(n)) return String(v)
  return pre + n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) + suf
}

export const fCr = (v) => {
  if (!v || isNaN(v)) return 'N/A'
  if (v >= 100000) return '₹' + (v / 100000).toFixed(1) + 'L Cr'
  if (v >= 10000)  return '₹' + (v / 100).toFixed(0) + 'K Cr'
  return '₹' + parseFloat(v).toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' Cr'
}

// Grade → color
export const gradeColor = (g) =>
  ({ A: '#00ff88', B: '#00cc6a', C: '#f5c842', D: '#ff8844', F: '#ff4560' })[g?.[0]] || '#567056'

// Verdict → class
export const vc = (v = '') => {
  const vl = String(v).toLowerCase()
  if (['excellent','strong','high','robust','safe','clean','bullish','rapid','hyper',
       'debt-free','conviction','lean','efficient','very high','good'].some(w => vl.includes(w))) return 'cg'
  if (['weak','poor','risky','suspicious','distress','declining','overbought',
       'stretched','thin','leveraged','tight','heavy'].some(w => vl.includes(w))) return 'cr'
  if (['moderate','fair','average','neutral','borderline','grey','acceptable',
       'normal','stable','adequate'].some(w => vl.includes(w))) return 'cy'
  return 'cd'
}

// Score bar color
export const scoreColor = (score, max = 10) => {
  const p = score / max
  return p >= 0.7 ? 'var(--green)' : p >= 0.4 ? 'var(--yellow)' : 'var(--red)'
}

// Trend → class
export const trendClass = (pct) =>
  pct >= 60 ? 'tag-g' : pct <= 40 ? 'tag-r' : 'tag-y'

// Sentiment → article class
export const sentClass = (label = '') => {
  const m = { 'Very Positive': 'vpos', 'Positive': 'pos', 'Negative': 'neg', 'Very Negative': 'vneg' }
  return m[label] || ''
}

export const sentBadgeClass = (label = '') => {
  const m = { 'Very Positive': 'tag-g', 'Positive': 'tag-g', 'Negative': 'tag-r', 'Very Negative': 'tag-r' }
  return m[label] || 'tag-m'
}

// Draw sparkline on canvas
export const drawSparkline = (canvas, data) => {
  if (!canvas || !data?.length) return
  const ctx = canvas.getContext('2d')
  const w = canvas.offsetWidth || 230
  canvas.width = w; canvas.height = 22
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1
  const isUp = data[data.length - 1] >= data[0]
  const col = isUp ? '#00ff88' : '#ff4560'
  const pts = data.map((v, i) => ({ x: i / (data.length - 1) * w, y: 22 - (v - mn) / rng * 18 - 2 }))
  const g = ctx.createLinearGradient(0, 0, 0, 22)
  g.addColorStop(0, isUp ? 'rgba(0,255,136,0.18)' : 'rgba(255,69,96,0.18)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.clearRect(0, 0, w, 22)
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
  pts.forEach(p => ctx.lineTo(p.x, p.y))
  ctx.lineTo(w, 22); ctx.lineTo(0, 22); ctx.closePath()
  ctx.fillStyle = g; ctx.fill()
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
  pts.forEach(p => ctx.lineTo(p.x, p.y))
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke()
}

// Recharts common theme
export const CHART_THEME = {
  backgroundColor: 'transparent',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 9,
  fill: '#567056',
}

export const CHART_COLORS = {
  green:  '#00ff88',
  green2: '#00cc6a',
  blue:   '#00b4ff',
  yellow: '#f5c842',
  red:    '#ff4560',
  purple: '#c084fc',
  muted:  '#567056',
}
