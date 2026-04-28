import { useState, useEffect } from 'react'
import { useStore } from './store'
import { Toast, showToast } from './components/Toast'
import Topbar from './components/layout/Topbar'
import Sidebar from './components/layout/Sidebar'
import Overview from './components/tabs/Overview'
import News from './components/tabs/News'
import Advanced from './components/tabs/Advanced'
import Peers from './components/tabs/Peers'
import DCF from './components/tabs/DCF'
import Checklist from './components/tabs/Checklist'
import Sizer from './components/tabs/Sizer'
import Screen from './components/tabs/Screen'
import Portfolio from './components/tabs/Portfolio'
import Journal from './components/tabs/Journal'
import Alerts from './components/tabs/Alerts'
import Notes from './components/tabs/Notes'
import Calculators from './components/tabs/Calculators'
import Compare from './components/tabs/Compare'
import OptionsTab from './components/tabs/OptionsTab'
import ConcallTab from './components/tabs/ConcallTab'
import MutualFundsTab from './components/tabs/MutualFundsTab'
import StrategicTab from './components/tabs/StrategicTab'

// Mobile bottom nav tabs (most used)
const MOBILE_NAV = [
  { id:'overview',  icon:'◈', label:'Overview' },
  { id:'news',      icon:'◉', label:'News' },
  { id:'dcf',       icon:'⊛', label:'DCF' },
  { id:'portfolio', icon:'◫', label:'Portfolio' },
  { id:'journal',   icon:'◩', label:'Journal' },
]

const ALL_TABS = [
  { id:'overview',  label:'◈ Overview' },
  { id:'news',      label:'◉ News' },
  { id:'advanced',  label:'⊗ Advanced' },
  { id:'peers',     label:'⊞ Peers' },
  { id:'dcf',       label:'⊛ DCF' },
  { id:'checklist', label:'✓ Checklist' },
  { id:'sizer',     label:'◉ Size' },
  { id:'screen',    label:'⊡ Screen' },
  { id:'portfolio', label:'◫ Portfolio' },
  { id:'journal',   label:'◩ Journal' },
  { id:'alerts',    label:'◎ Alerts' },
  { id:'notes',     label:'◧ Notes' },
  { id:'compare',   label:'⇋ Compare' },
  { id:'options',   label:'☷ Options' },
  { id:'concall',   label:'✆ Concall' },
  { id:'mf',        label:'⛃ Mut.Funds' },
  { id:'strategic',  label:'☉ Strategic' },
  { id:'calculators',label:'∑ Calc' },
]

function AddModal({ onClose }) {
  const { analyseStock, addToWatchlist } = useStore()
  const [val, setVal] = useState('')
  const [loading, setLoading] = useState(false)
  const { backendLive } = useStore()

  const doAdd = async () => {
    const s = val.trim().toUpperCase(); if (!s) return
    if (!backendLive) { showToast('⚠ Backend offline. Run: python server.py', 'error'); onClose(); return }
    setLoading(true)
    addToWatchlist(s)
    onClose()
    try {
      await analyseStock(s)
      showToast(`✓ ${s} added & analysed`)
    } catch(e) { showToast(`⚠ ${e.message}`, 'error') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal">
        <div className="modal-title">Add to Watchlist</div>
        <div className="modal-sub">Enter an NSE ticker — live data fetched from backend</div>
        <input className="input" autoFocus placeholder="e.g. KRN, HDFCBANK, TATAMOTORS" value={val}
          onChange={e=>setVal(e.target.value.toUpperCase())}
          onKeyDown={e=>{if(e.key==='Enter')doAdd();if(e.key==='Escape')onClose()}}/>
        <div style={{fontSize:9,color:'var(--muted)',marginTop:5}}>Supports NSE symbols. Full company names also work: "ICICI Bank", "Tata Motors"</div>
        <div className="modal-btns">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={doAdd} disabled={loading}>{loading?'Analysing…':'Analyse & Add'}</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const theme = useStore(s => s.theme)
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const { activeStock, stockCache } = useStore()

  const data = activeStock ? stockCache[activeStock] : null
  const backendLive = useStore(s=>s.backendLive)

  // Initialize theme on first render
  useEffect(() => {
    try { document.documentElement.setAttribute('data-theme', theme) } catch {}
  }, [theme])

  // Welcome tour modal (first-run)
  const [showWelcome, setShowWelcome] = useState(false)
  useEffect(() => {
    const seen = localStorage.getItem('dd-welcome-seen')
    if (!seen) {
      setShowWelcome(true)
    }
  }, [])

  const closeWelcome = () => {
    localStorage.setItem('dd-welcome-seen', '1')
    setShowWelcome(false)
  }

  // Live market alerts polling
  useEffect(() => {
    if (!backendLive) return
    let active = true
    
    const pollLiveAlerts = async () => {
      try {
        const res = await fetch('/api/live-alerts')
        const data = await res.json()
        if (data.ok && data.alert && active) {
          showToast(data.alert, 'alert', 6000)
        }
      } catch (e) {
        // ignore polling errors
      }
    }
    
    // Poll every 30 seconds
    const interval = setInterval(pollLiveAlerts, 30000)
    return () => { active = false; clearInterval(interval) }
  }, [backendLive])

  // Close sidebar on desktop resize
  useEffect(() => {
    const h = () => { if (window.innerWidth > 768) setSidebarOpen(false) }
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const renderTab = () => {
    switch(activeTab) {
      case 'overview':  return <Overview data={data}/>
      case 'news':      return <News data={data}/>
      case 'advanced':  return <Advanced data={data}/>
      case 'peers':     return <Peers data={data}/>
      case 'dcf':       return <DCF data={data}/>
      case 'checklist': return <Checklist data={data}/>
      case 'sizer':     return <Sizer data={data}/>
      case 'screen':    return <Screen/>
      case 'portfolio': return <Portfolio/>
      case 'journal':   return <Journal/>
      case 'alerts':    return <Alerts/>
      case 'notes':     return <Notes data={data}/>
      case 'compare':   return <Compare/>
      case 'options':   return <OptionsTab data={data}/>
      case 'concall':   return <ConcallTab data={data}/>
      case 'mf':        return <MutualFundsTab data={data}/>
      case 'strategic': return <StrategicTab data={data}/>
      case 'calculators':return <Calculators/>
      default:          return <Overview data={data}/>
    }
  }

  // Welcome modal component (inline for quick UX boost)
  const WelcomeModal = () => (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeWelcome() }}>
      <div className="modal" role="dialog" aria-label="Welcome">
        <div className="modal-title">Welcome to DeepDive</div>
        <div className="modal-sub" style={{ marginBottom: 8 }}>
          A quick tour to help you get started. You can always skip this later.
        </div>
        <ul style={{ paddingLeft: 18, marginTop: 6, color: 'var(--text)' }}>
          <li>Use the left sidebar to manage your stock watchlist and portfolio.</li>
          <li>Search stocks quickly from the top bar and analyse with one click.</li>
          <li>Navigate between tabs to view News, DCF, Portfolio, Journal, and more.</li>
          <li>Toggle theme for a comfortable reading experience.</li>
        </ul>
        <div className="modal-btns" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn-outline" onClick={closeWelcome}>Remind me later</button>
          <button className="btn-primary" onClick={closeWelcome}>Got it</button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="app-shell">
        <Topbar onHamburger={() => setSidebarOpen(o => !o)}/>

        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}/>}

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onAddClick={() => setShowAddModal(true)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="main-area">
          {/* Desktop tab bar */}
          <div className="tab-bar">
            {ALL_TABS.map(t => (
              <button key={t.id} className={`tab-btn${activeTab===t.id?' active':''}`} onClick={() => setActiveTab(t.id)}>
                {t.label.split(' ')[1]}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="tab-content" key={activeTab}>
            {renderTab()}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        <div className="mobile-nav-items">
          {MOBILE_NAV.map(t => (
            <button key={t.id} className={`mobile-nav-item${activeTab===t.id?' active':''}`} onClick={() => setActiveTab(t.id)}>
              <span className="mobile-nav-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
          <button className={`mobile-nav-item`} onClick={() => setSidebarOpen(true)}>
            <span className="mobile-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </span>
            <span>Menu</span>
          </button>
        </div>
      </div>

      {showAddModal && <AddModal onClose={() => setShowAddModal(false)}/>}
      {showWelcome && <WelcomeModal/>}
      <Toast/>
    </>
  )
}
