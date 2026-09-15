import { useEffect, useState, useMemo } from 'react'
import QuickLogTable from './components/QuickLogTable'
import JournalTable from './components/JournalTable'
import StatsDashboard from './components/StatsDashboard'
import Toast from './components/Toast'
import {
  CandlestickIcon,
  PlusCircleIcon,
  BookOpenIcon,
  BarChart3Icon,
  RotateCcwIcon,
  AlertCircleIcon,
} from './components/Icons'
import { createEntry, deleteEntry, listEntries, updateEntry } from './api'

const TABS = [
  { id: 'Log Entry', label: 'Log Trade', icon: PlusCircleIcon },
  { id: 'Journal', label: 'Journal', icon: BookOpenIcon },
  { id: 'Stats', label: 'Analytics', icon: BarChart3Icon },
]

export default function App() {
  const [tab, setTab] = useState('Log Entry')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toasts, setToasts] = useState([])

  function addToast(message, type = 'success') {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  async function refresh(silent = false) {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await listEntries()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
      addToast(`Failed to load entries: ${err.message}`, 'error')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  // Global keyboard shortcuts (1, 2, 3 for tabs)
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return
      }
      if (e.key === '1') setTab('Log Entry')
      if (e.key === '2') setTab('Journal')
      if (e.key === '3') setTab('Stats')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function handleCreate(entry, imageBase64) {
    try {
      await createEntry(entry, imageBase64)
      addToast('Trade recorded to journal!', 'success')
      await refresh(true)
      setTab('Journal')
    } catch (err) {
      addToast(err.message || 'Failed to save trade', 'error')
      throw err
    }
  }

  async function handleUpdate(id, entry, imageBase64) {
    try {
      await updateEntry(id, entry, imageBase64)
      addToast('Trade entry updated!', 'success')
      await refresh(true)
    } catch (err) {
      addToast(err.message || 'Failed to update trade', 'error')
      throw err
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEntry(id)
      addToast('Trade deleted.', 'info')
      await refresh(true)
    } catch (err) {
      addToast(err.message || 'Failed to delete trade', 'error')
      throw err
    }
  }

  // Quick summary calculation for header stat strip
  const summary = useMemo(() => {
    const total = entries.length
    const wins = entries.filter((e) => e.outcome === 'Win').length
    const winRate = total ? ((wins / total) * 100).toFixed(0) : 0
    const pnl = entries.reduce((s, e) => s + (Number(e.pnl) || 0), 0)
    return { total, winRate, pnl }
  }, [entries])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* App Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
              <CandlestickIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900">
                  Crypto Backtest
                </h1>
                <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Strategy Journal & Performance Tracker</p>
            </div>
          </div>

          {/* Quick Stat Strip & Refresh Button */}
          <div className="flex items-center gap-3">
            {entries.length > 0 && (
              <div className="hidden sm:flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-1.5 text-xs font-mono shadow-2xs">
                <span className="text-slate-600">
                  <strong className="text-slate-900 font-semibold">{summary.total}</strong> trades
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">
                  WR: <strong className="text-emerald-600 font-semibold">{summary.winRate}%</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span
                  className={`font-semibold ${
                    summary.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {summary.pnl >= 0 ? `+$${summary.pnl.toFixed(2)}` : `$${summary.pnl.toFixed(2)}`}
                </span>
              </div>
            )}

            <button
              onClick={() => refresh(false)}
              disabled={loading}
              title="Refresh journal entries"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <RotateCcwIcon className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-header with Segmented Tab Controls */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5">
          <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60">
            {TABS.map((t) => {
              const Icon = t.icon
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                  {t.id === 'Journal' && entries.length > 0 && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {entries.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>Shortcuts:</span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600 shadow-2xs">1</kbd>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600 shadow-2xs">2</kbd>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600 shadow-2xs">3</kbd>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-2xs">
            <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-rose-900">Failed to connect to Google Sheets backend</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => refresh(false)}
              className="text-xs font-semibold text-rose-800 underline hover:text-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <SkeletonLoader />
        ) : (
          <div className="animate-in fade-in duration-200">
            {tab === 'Log Entry' && <QuickLogTable onSubmit={handleCreate} />}
            {tab === 'Journal' && (
              <JournalTable entries={entries} onUpdate={handleUpdate} onDelete={handleDelete} />
            )}
            {tab === 'Stats' && <StatsDashboard entries={entries} />}
          </div>
        )}
      </main>

      {/* Floating Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-3 w-16 bg-slate-200 rounded mb-2"></div>
            <div className="h-6 w-24 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
      <div className="h-96 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"></div>
    </div>
  )
}
