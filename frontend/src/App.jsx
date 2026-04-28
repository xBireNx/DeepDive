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

const MOBILE_TABS = [
  { id: 'overview', icon: '◈', label: 'Home' },
  { id: 'news', icon: '◉', label: 'News' },
  { id: 'dcf', icon: '⊛', label: 'DCF' },
  { id: 'portfolio', icon: '◫', label: 'Portfolio' },
  { id: 'journal', icon: '◩', label: 'Notes' },
]

const ALL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'news', label: 'News' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'peers', label: 'Peers' },
  { id: 'dcf', label: 'DCF' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'sizer', label: 'Sizer' },
  { id: 'screen', label: 'Screen' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'journal', label: 'Journal' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'notes', label: 'Notes' },
  { id: 'compare', label: 'Compare' },
  { id: 'options', label: 'Options' },
  { id: 'concall', label: 'Concall' },
  { id: 'mf', label: 'M.Funds' },
  { id: 'strategic', label: 'Strategic' },
  { id: 'calculators', label: 'Tools' },
]

function AddModal({ onClose }) {
  const { analyseStock, addToWatchlist } = useStore()
  const [val, setVal] = useState('')
  const [loading, setLoading] = useState(false)
  const backendLive = useStore(s => s.backendLive)

  const doAdd = async () => {
    const s = val.trim().toUpperCase()
    if (!s) return
    if (!backendLive) {
      showToast('Backend offline. Run: python server.py', 'error')
      onClose()
      return
    }
    setLoading(true)
    addToWatchlist(s)
    onClose()
    try {
      await analyseStock(s)
      showToast(`${s} added & analysed`)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-title">Add Stock</div>
        <div className="modal-sub">Enter NSE ticker symbol to analyze</div>
        <input
          className="input"
          autoFocus
          placeholder="e.g. KRN, HDFCBANK, TATAMOTORS"
          value={val}
          onChange={e => setVal(e.target.value.toUpperCase())}
          onKeyDown={e => {
            if (e.key === 'Enter') doAdd()
            if (e.key === 'Escape') onClose()
          }}
        />
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10 }}>
          Supports NSE symbols and full company names
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={doAdd} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze & Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

function WelcomeModal({ onClose }) {
  const handleClose = () => {
    localStorage.setItem('dd-welcome-seen', '1')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="modal">
        <div className="modal-title">Welcome to DeepDive Pro</div>
        <div className="modal-sub">
          Professional stock analysis terminal. Here's how to get started:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--accent-primary)', fontSize: 16 }}>◆</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 14 }}>Track Your Watchlist</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Add stocks from sidebar and monitor in real-time</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--accent-primary)', fontSize: 16 }}>◆</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 14 }}>Deep Analysis</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>DCF valuation, technicals, peers, and advanced metrics</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--accent-primary)', fontSize: 16 }}>◆</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 14 }}>Portfolio & Journal</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Track holdings and maintain investment notes</div>
            </div>
          </div>
        </div>
        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button className="btn-secondary" onClick={handleClose}>Remind Later</button>
          <button className="btn-primary" onClick={handleClose}>Get Started</button>
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
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('dd-welcome-seen')
  })
  const { activeStock, stockCache } = useStore()

  const data = activeStock ? stockCache[activeStock] : null
  const backendLive = useStore(s => s.backendLive)

  useEffect(() => {
    try { document.documentElement.setAttribute('data-theme', theme) } catch (e) { }
  }, [theme])

  useEffect(() => {
    if (!backendLive) return
    let active = true
    const pollAlerts = async () => {
      try {
        const res = await fetch('/api/live-alerts')
        const json = await res.json()
        if (json.ok && json.alert && active) {
          showToast(json.alert, 'warning', 6000)
        }
      } catch { }
    }
    const interval = setInterval(pollAlerts, 30000)
    return () => { active = false; clearInterval(interval) }
  }, [backendLive])

  useEffect(() => {
    const h = () => { if (window.innerWidth > 768) setSidebarOpen(false) }
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      const tabMap = {
        'o': 'overview', 'n': 'news', 'a': 'advanced', 'p': 'peers',
        'd': 'dcf', 'c': 'checklist', 's': 'sizer', 'w': 'screen',
        'f': 'portfolio', 'j': 'journal', 'l': 'alerts', 't': 'notes',
        'm': 'compare', 'x': 'options', 'k': 'concall', 'u': 'mf',
        'r': 'strategic', '=': 'calculators'
      }
      
      if (tabMap[e.key]) setActiveTab(tabMap[e.key])
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <Overview data={data} />
      case 'news': return <News data={data} />
      case 'advanced': return <Advanced data={data} />
      case 'peers': return <Peers data={data} />
      case 'dcf': return <DCF data={data} />
      case 'checklist': return <Checklist data={data} />
      case 'sizer': return <Sizer data={data} />
      case 'screen': return <Screen />
      case 'portfolio': return <Portfolio />
      case 'journal': return <Journal />
      case 'alerts': return <Alerts />
      case 'notes': return <Notes data={data} />
      case 'compare': return <Compare />
      case 'options': return <OptionsTab data={data} />
      case 'concall': return <ConcallTab data={data} />
      case 'mf': return <MutualFundsTab data={data} />
      case 'strategic': return <StrategicTab data={data} />
      case 'calculators': return <Calculators />
      default: return <Overview data={data} />
    }
  }

  return (
    <>
      {sidebarOpen && <div className="modal-overlay" style={{ zIndex: 250 }} onClick={() => setSidebarOpen(false)} />}
      
      <div className="app-shell">
        <Topbar 
          onHamburger={() => setSidebarOpen(o => !o)}
          onAddStock={() => setShowAddModal(true)}
        />

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onAddClick={() => setShowAddModal(true)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="main-area">
          <div className="tab-bar">
            {ALL_TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-content" key={activeTab}>
            {renderTab()}
          </div>
        </div>
      </div>

      <div className="mobile-nav">
        <div className="mobile-nav-items">
          {MOBILE_TABS.map(t => (
            <button
              key={t.id}
              className={`mobile-nav-item${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="mobile-nav-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
          <button className="mobile-nav-item" onClick={() => setSidebarOpen(true)}>
            <span className="mobile-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </span>
            <span>Menu</span>
          </button>
        </div>
      </div>

      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} />}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      <Toast />
    </>
  )
}