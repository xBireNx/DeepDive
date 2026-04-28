import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── API HELPERS ────────────────────────────────────────────────────────────
const API = '/api'

export const api = {
  async analyse(symbol, force = false) {
    const r = await fetch(`${API}/analyse/${symbol}${force ? '?force=true' : ''}`,
      { signal: AbortSignal.timeout(90000) })
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Analysis failed') }
    return (await r.json()).data
  },
  async news(symbol) {
    const r = await fetch(`${API}/news/${symbol}`, { signal: AbortSignal.timeout(20000) })
    if (!r.ok) throw new Error('News unavailable')
    return (await r.json()).news
  },
  async price(symbol) {
    const r = await fetch(`${API}/price/${symbol}`, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw new Error('Price unavailable')
    return await r.json()
  },
  async status() {
    const r = await fetch(`${API}/status`, { signal: AbortSignal.timeout(3000) })
    return r.ok ? await r.json() : null
  },
  async health() {
    const r = await fetch(`${API}/health`, { signal: AbortSignal.timeout(5000) })
    return r.ok ? await r.json() : null
  },
  async search(q) {
    const r = await fetch(`${API}/search?q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(6000) })
    if (!r.ok) return []
    return (await r.json()).results || []
  },
  async screen(filters) {
    const r = await fetch(`${API}/screen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters }),
      signal: AbortSignal.timeout(10000)
    })
    if (!r.ok) throw new Error('Screen failed')
    return await r.json()
  },
  async advancedScreen(filters) {
    const r = await fetch(`${API}/screen/advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters }),
      signal: AbortSignal.timeout(15000)
    })
    if (!r.ok) throw new Error('Advanced screen failed')
    return await r.json()
  },
  async portfolioAnalytics(holdings) {
    const r = await fetch(`${API}/portfolio/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings }),
      signal: AbortSignal.timeout(10000)
    })
    if (!r.ok) throw new Error('Portfolio analytics failed')
    return await r.json()
  },
  async bulkExport(symbols) {
    const r = await fetch(`${API}/export/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
      signal: AbortSignal.timeout(30000)
    })
    if (!r.ok) throw new Error('Export failed')
    return await r.json()
  },
  async cacheInfo() {
    const r = await fetch(`${API}/cache`, { signal: AbortSignal.timeout(5000) })
    return r.ok ? await r.json() : null
  },
  async analysisHistory() {
    const r = await fetch(`${API}/analysis_history`, { signal: AbortSignal.timeout(5000) })
    return r.ok ? await r.json() : null
  },
}

// ── MAIN STORE ────────────────────────────────────────────────────────────
export const useStore = create(
  persist(
    (set, get) => ({
      // Connection
      backendLive: false,
      setBackendLive: (v) => set({ backendLive: v }),

      // Theme (dark/light)
      theme: 'dark',
      setTheme: (t) => {
        const next = t === 'light' ? 'light' : 'dark'
        // Persist via zustand persist, but also apply immediately to document
        set({ theme: next })
        try {
          document.documentElement.setAttribute('data-theme', next)
        } catch {}
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        try { document.documentElement.setAttribute('data-theme', next) } catch {}
      },

      // Active stock & cache
      activeStock: null,
      stockCache: {},   // { symbol: analysisData }
      newsCache: {},    // { symbol: newsData }
      loadingStocks: new Set(),

      setActiveStock: (symbol) => set({ activeStock: symbol }),

      isLoading: (symbol) => get().loadingStocks.has(symbol),

      async analyseStock(symbol, force = false) {
        const { stockCache, loadingStocks } = get()
        if (!force && stockCache[symbol]) {
          set({ activeStock: symbol })
          return stockCache[symbol]
        }
        set({ loadingStocks: new Set([...loadingStocks, symbol]) })
        try {
          const data = await api.analyse(symbol, force)
          set(s => ({
            stockCache: { ...s.stockCache, [symbol]: data },
            activeStock: symbol,
            loadingStocks: new Set([...s.loadingStocks].filter(x => x !== symbol))
          }))
          return data
        } catch (e) {
          set(s => ({ loadingStocks: new Set([...s.loadingStocks].filter(x => x !== symbol)) }))
          throw e
        }
      },

      async fetchNews(symbol) {
        const { newsCache } = get()
        if (newsCache[symbol]) return newsCache[symbol]
        const data = await api.news(symbol)
        set(s => ({ newsCache: { ...s.newsCache, [symbol]: data } }))
        return data
      },

      clearNewsCache(symbol) {
        set(s => { const n = { ...s.newsCache }; delete n[symbol]; return { newsCache: n } })
      },

      // Watchlist
      watchlist: ['KRN', 'RELIANCE', 'HDFCBANK'],
      conviction: {}, // { symbol: 'high'|'medium'|'low' }

      addToWatchlist(symbol) {
        set(s => {
          if (s.watchlist.includes(symbol)) return {}
          return { watchlist: [...s.watchlist, symbol] }
        })
      },
      removeFromWatchlist(symbol) {
        set(s => ({
          watchlist: s.watchlist.filter(x => x !== symbol),
          activeStock: s.activeStock === symbol ? null : s.activeStock,
        }))
      },
      toggleConviction(symbol) {
        set(s => {
          const cur = s.conviction[symbol] || 'medium'
          const next = cur === 'high' ? 'medium' : cur === 'medium' ? 'low' : 'high'
          return { conviction: { ...s.conviction, [symbol]: next } }
        })
      },

      // Portfolio
      portfolio: [], // [{ticker, qty, buyPrice, date}]
      addHolding(h) { set(s => ({ portfolio: [...s.portfolio, h] })) },
      removeHolding(i) { set(s => ({ portfolio: s.portfolio.filter((_, idx) => idx !== i) })) },

      // Journal
      journal: [],
      addJournalEntry(e) { set(s => ({ journal: [e, ...s.journal] })) },
      removeJournalEntry(i) { set(s => ({ journal: s.journal.filter((_, idx) => idx !== i) })) },

      // Alerts
      alerts: {}, // { symbol: { buy, target, sl } }
      setAlert(symbol, alert) { set(s => ({ alerts: { ...s.alerts, [symbol]: alert } })) },
      clearAlert(symbol) { set(s => { const a = { ...s.alerts }; delete a[symbol]; return { alerts: a } }) },

      // Notes
      notes: {}, // { symbol: string }
      setNote(symbol, text) { set(s => ({ notes: { ...s.notes, [symbol]: text } })) },

      // Checklist
      checkState: {}, // { symbol: { q_id: bool } }
      toggleCheck(symbol, id) {
        set(s => {
          const cur = s.checkState[symbol] || {}
          return { checkState: { ...s.checkState, [symbol]: { ...cur, [id]: !cur[id] } } }
        })
      },
      resetChecklist(symbol) {
        set(s => { const c = { ...s.checkState }; delete c[symbol]; return { checkState: c } })
      },

      // Export/Import data
      exportData() {
        const state = get()
        const data = {
          version: '4.0',
          exportDate: new Date().toISOString(),
          watchlist: state.watchlist,
          portfolio: state.portfolio,
          journal: state.journal,
          alerts: state.alerts,
          notes: state.notes,
          checkState: state.checkState,
        }
        return JSON.stringify(data, null, 2)
      },

      importData(jsonString) {
        try {
          const data = JSON.parse(jsonString)
          if (data.version && data.watchlist) {
            set(s => ({
              watchlist: data.watchlist || s.watchlist,
              portfolio: data.portfolio || s.portfolio,
              journal: data.journal || s.journal,
              alerts: data.alerts || s.alerts,
              notes: data.notes || s.notes,
              checkState: data.checkState || s.checkState,
            }))
            return { ok: true, msg: 'Data imported successfully' }
          }
          return { ok: false, msg: 'Invalid data format' }
        } catch (e) {
          return { ok: false, msg: 'Invalid JSON' }
        }
      },

      clearAllData() {
        set({
          watchlist: [],
          portfolio: [],
          journal: [],
          alerts: {},
          notes: {},
          checkState: {},
          stockCache: {},
          activeStock: null,
        })
      },
    }),
    {
      name: 'deepdive-store',
      partialize: (s) => ({
        watchlist: s.watchlist,
        conviction: s.conviction,
        portfolio: s.portfolio,
        journal: s.journal,
        alerts: s.alerts,
        notes: s.notes,
        checkState: s.checkState,
        stockCache: s.stockCache,
        theme: s.theme,
      }),
    }
  )
)
