import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { CHART_COLORS } from '../../utils'

const TT = { backgroundColor:'#0f1610', border:'1px solid rgba(0,255,136,0.2)', borderRadius:6, fontSize:10, fontFamily:"'IBM Plex Mono',monospace", color:'#c8dfc8' }
const TICK = { fill:'#567056', fontSize:9, fontFamily:"'IBM Plex Mono',monospace" }
const DCOLS = [CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.yellow, '#567056', CHART_COLORS.purple, CHART_COLORS.red]

const NoData = ({ h=140 }) => (
  <div style={{height:h,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:10}}>No data available</div>
)

export function PriceChart({ data=[] }) {
  if (!data.length) return <NoData/>
  const isUp = data[data.length-1]?.close >= data[0]?.close
  const col = isUp ? CHART_COLORS.green : CHART_COLORS.red
  const cd = data.map(d => ({ date: (d.date||'').slice(5), price: d.close }))
  const prices = cd.map(d=>d.price)
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={cd} margin={{top:4,right:4,bottom:0,left:0}}>
        <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity={0.15}/>
          <stop offset="100%" stopColor={col} stopOpacity={0}/>
        </linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,136,0.04)" vertical={false}/>
        <XAxis dataKey="date" tick={TICK} tickLine={false} axisLine={false} interval={Math.floor(cd.length/5)}/>
        <YAxis tick={TICK} tickLine={false} axisLine={false} domain={[Math.min(...prices)*0.995, Math.max(...prices)*1.005]} tickFormatter={v=>`₹${v>=1000?(v/1000).toFixed(0)+'k':v.toFixed(0)}`} width={44}/>
        <Tooltip contentStyle={TT} formatter={v=>[`₹${v.toLocaleString('en-IN',{maximumFractionDigits:0})}`,'Price']} labelStyle={{color:'#c8dfc8',fontSize:9}}/>
        <Area type="monotone" dataKey="price" stroke={col} strokeWidth={2} fill="url(#pg)" dot={false} activeDot={{r:4,fill:col}}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function QuarterlyChart({ data=[] }) {
  if (!data.length) return <NoData/>
  const cd = [...data].reverse().map(q=>({
    q: (q.quarter||'').replace('FY','F'),
    rev: parseFloat(q.revenue)||0,
    pat: parseFloat(q.net_profit)||0
  }))
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={cd} margin={{top:4,right:4,bottom:0,left:0}} barGap={2} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,136,0.04)" vertical={false}/>
        <XAxis dataKey="q" tick={TICK} tickLine={false} axisLine={false}/>
        <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}K`:String(v)} width={36}/>
        <Tooltip contentStyle={TT} formatter={(v,n)=>[`₹${v.toLocaleString('en-IN',{maximumFractionDigits:0})} Cr`,n==='rev'?'Revenue':'Profit']} labelStyle={{color:'#c8dfc8',fontSize:9}}/>
        <Legend iconSize={8} wrapperStyle={{fontSize:9,fontFamily:"'IBM Plex Mono'"}} formatter={v=>v==='rev'?'Revenue':'Profit'}/>
        <Bar dataKey="rev" fill={`${CHART_COLORS.blue}50`} stroke={CHART_COLORS.blue} strokeWidth={1} radius={[2,2,0,0]}/>
        <Bar dataKey="pat" fill={`${CHART_COLORS.green}55`} stroke={CHART_COLORS.green} strokeWidth={1} radius={[2,2,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function OPMChart({ data=[] }) {
  const cd = [...data].reverse().map(q=>({ q:(q.quarter||'').replace('FY','F'), opm:parseFloat(q.opm)||0 }))
  if (!cd.length) return <NoData h={150}/>
  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={cd} margin={{top:4,right:4,bottom:0,left:0}}>
        <defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={0.15}/>
          <stop offset="100%" stopColor={CHART_COLORS.purple} stopOpacity={0}/>
        </linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,136,0.04)" vertical={false}/>
        <XAxis dataKey="q" tick={TICK} tickLine={false} axisLine={false}/>
        <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={32}/>
        <Tooltip contentStyle={TT} formatter={v=>[`${v?.toFixed(1)}%`,'OPM']} labelStyle={{color:'#c8dfc8',fontSize:9}}/>
        <Area type="monotone" dataKey="opm" stroke={CHART_COLORS.purple} strokeWidth={2} fill="url(#og)" dot={{r:3,fill:CHART_COLORS.purple}} activeDot={{r:5}}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DonutChart({ data={} }) {
  const entries = Object.entries(data).filter(([,v])=>v>0)
  if (!entries.length) return <NoData/>
  const pd = entries.map(([k,v])=>({ name:k.charAt(0).toUpperCase()+k.slice(1), value:parseFloat(v)||0 }))
  return (
    <ResponsiveContainer width="100%" height={140}>
      <PieChart>
        <Pie data={pd} cx="50%" cy="50%" innerRadius={36} outerRadius={54} dataKey="value" paddingAngle={2}>
          {pd.map((_,i)=><Cell key={i} fill={DCOLS[i%DCOLS.length]} stroke="#050805" strokeWidth={2}/>)}
        </Pie>
        <Tooltip contentStyle={TT} formatter={v=>[`${v?.toFixed(1)}%`]} labelStyle={{color:'#c8dfc8',fontSize:9}}/>
        <Legend iconSize={7} wrapperStyle={{fontSize:8,fontFamily:"'IBM Plex Mono'"}}/>
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ScoreRadar({ scorecards=[] }) {
  if (!scorecards.length) return null
  const data = scorecards.map(c=>({ subject:c.category.split(' ')[0], score:(c.score/c.max_score)*10, fullMark:10 }))
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(0,255,136,0.08)"/>
        <PolarAngleAxis dataKey="subject" tick={{fill:'#567056',fontSize:9,fontFamily:"'IBM Plex Mono'"}}/>
        <Radar dataKey="score" stroke={CHART_COLORS.green} fill={CHART_COLORS.green} fillOpacity={0.1} strokeWidth={2} dot={{r:3,fill:CHART_COLORS.green,strokeWidth:0}}/>
        <Tooltip contentStyle={TT} formatter={v=>[`${v?.toFixed(1)}/10`]} labelStyle={{color:'#c8dfc8',fontSize:9}}/>
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function RelativeReturnChart({ priceHistory=[], niftyHistory=[], symbol='' }) {
  if (!priceHistory.length || !niftyHistory.length) return <NoData/>
  const sBase = priceHistory[0]?.close||1
  const nBase = niftyHistory[0]?.close||1
  const nMap = {}; niftyHistory.forEach(h=>{ nMap[h.date]=h.close })
  const cd = priceHistory.map(h=>({
    date:(h.date||'').slice(5),
    stock:+((h.close/sBase-1)*100).toFixed(2),
    nifty:nMap[h.date]?+((nMap[h.date]/nBase-1)*100).toFixed(2):null
  })).filter(d=>d.nifty!==null)
  if (!cd.length) return <NoData/>
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={cd} margin={{top:4,right:4,bottom:0,left:0}}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,136,0.04)" vertical={false}/>
        <XAxis dataKey="date" tick={TICK} tickLine={false} axisLine={false} interval={Math.floor(cd.length/5)}/>
        <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={v=>`${v>=0?'+':''}${v}%`} width={44}/>
        <Tooltip contentStyle={TT} formatter={(v,n)=>[`${v>=0?'+':''}${v?.toFixed(1)}%`,n==='stock'?symbol:'Nifty 50']} labelStyle={{color:'#c8dfc8',fontSize:9}}/>
        <Legend iconSize={8} wrapperStyle={{fontSize:9,fontFamily:"'IBM Plex Mono'"}} formatter={v=>v==='stock'?symbol:'Nifty 50'}/>
        <Line type="monotone" dataKey="stock" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} activeDot={{r:4}}/>
        <Line type="monotone" dataKey="nifty" stroke={CHART_COLORS.muted} strokeWidth={1.5} dot={false} strokeDasharray="4 3"/>
      </LineChart>
    </ResponsiveContainer>
  )
}

export function SectorPie({ data={} }) {
  const entries = Object.entries(data).filter(([,v])=>v>0)
  if (!entries.length) return <NoData h={160}/>
  const pd = entries.map(([k,v])=>({ name:k, value:+parseFloat(v).toFixed(0) }))
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={pd} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={2}>
          {pd.map((_,i)=><Cell key={i} fill={DCOLS[i%DCOLS.length]} stroke="#050805" strokeWidth={2}/>)}
        </Pie>
        <Tooltip contentStyle={TT} formatter={v=>[`₹${v.toLocaleString('en-IN',{maximumFractionDigits:0})}`]} labelStyle={{color:'#c8dfc8',fontSize:9}}/>
        <Legend iconSize={7} wrapperStyle={{fontSize:9,fontFamily:"'IBM Plex Mono'"}}/>
      </PieChart>
    </ResponsiveContainer>
  )
}

export function GradeBar({ data={} }) {
  const cd = Object.entries(data).map(([g,v])=>({ grade:g, count:v }))
  const colors = { A:CHART_COLORS.green, B:CHART_COLORS.green2, C:CHART_COLORS.yellow, D:CHART_COLORS.red, F:CHART_COLORS.red }
  return (
    <ResponsiveContainer width="100%" height={110}>
      <BarChart data={cd} margin={{top:4,right:4,bottom:0,left:0}}>
        <XAxis dataKey="grade" tick={TICK} tickLine={false} axisLine={false}/>
        <YAxis tick={TICK} tickLine={false} axisLine={false} width={20} allowDecimals={false}/>
        <Tooltip contentStyle={TT} labelStyle={{color:'#c8dfc8',fontSize:9}}/>
        <Bar dataKey="count" radius={[3,3,0,0]}>
          {cd.map((d,i)=><Cell key={i} fill={colors[d.grade]||CHART_COLORS.muted} fillOpacity={0.7}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── DUPONT TREND ─────────────────────────────────────────────────────────────
export function DuPontTrendChart({ trend = [] }) {
  if (!trend.length) return null
  const reversed = [...trend].reverse()
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={reversed} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(0,255,136,0.04)" vertical={false} />
        <XAxis dataKey="year" tick={TICK} tickLine={false} axisLine={false} />
        <YAxis tick={TICK} tickLine={false} axisLine={false} width={32} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#c8dfc8' }} />
        <Legend wrapperStyle={{ fontSize: 9, fontFamily: "'IBM Plex Mono'", color: '#567056' }} iconSize={8} />
        <Line type="monotone" dataKey="roe" name="ROE %" stroke={CHART_COLORS.green} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.green }} />
        <Line type="monotone" dataKey="netMargin" name="Net Margin %" stroke={CHART_COLORS.blue} strokeWidth={1.5} dot={{ r: 2, fill: CHART_COLORS.blue }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── PORTFOLIO DONUT (alias) ───────────────────────────────────────────────────
export const PortfolioDonut = SectorPie
export const ShareholdingDonut = DonutChart
export const GradeMixChart = GradeBar
export { default as PEBandChart } from './PEBandChart'
