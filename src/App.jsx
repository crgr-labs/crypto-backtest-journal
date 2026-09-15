import { useEffect, useState, useMemo } from 'react'
import LogEntryForm from './components/LogEntryForm'
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

  // Quick summary calculation for header pill
  const summary = useMemo(() => {
    const total = entries.length
    const wins = entries.filter((e) => e.outcome === 'Win').length
    const winRate = total ? ((wins / total) * 100).toFixed(0) : 0
    const pnl = entries.reduce((s, e) => s + (Number(e.pnl) || 0), 0)
    return { total, winRate, pnl }
  }, [entries])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sticky Glass App Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/20 text-white">
              <CandlestickIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-zinc-100">
                  Crypto Backtest
                </h1>
                <span className="rounded-full bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Strategy Journal & Performance Tracker</p>
            </div>
          </div>

          {/* Quick Metrics & Refresh Button */}
          <div className="flex items-center gap-3">
            {entries.length > 0 && (
              <div className="hidden sm:flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-xs font-mono">
                <span className="text-zinc-400">
                  <strong className="text-zinc-200 font-semibold">{summary.total}</strong> trades
                </span>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-400">
                  WR: <strong className="text-emerald-400 font-semibold">{summary.winRate}%</strong>
                </span>
                <span className="text-zinc-700">•</span>
                <span
                  className={`font-semibold ${
                    summary.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCcwIcon className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-header with Segmented Tab Controls */}
      <div className="border-b border-zinc-800/80 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5">
          <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800/90">
            {TABS.map((t) => {
              const Icon = t.icon
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm shadow-black/40 border border-zinc-700/60 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                  <span>{t.label}</span>
                  {t.id === 'Journal' && entries.length > 0 && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {entries.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-zinc-600 font-mono">
            <span>Shortcuts:</span>
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-zinc-400">1</kbd>
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-zinc-400">2</kbd>
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-zinc-400">3</kbd>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-300 backdrop-blur-sm">
            <AlertCircleIcon className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Failed to connect to Google Sheets backend</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => refresh(false)}
              className="text-xs font-semibold underline hover:text-rose-100"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <SkeletonLoader />
        ) : (
          <div className="animate-in fade-in duration-200">
            {tab === 'Log Entry' && <LogEntryForm onSubmit={handleCreate} />}
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
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"></div>
        ))}
      </div>
      <div className="h-96 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6"></div>
    </div>
  )
}
