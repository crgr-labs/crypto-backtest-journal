import { useMemo, useState } from 'react'
import LogEntryForm from './LogEntryForm'
import { OUTCOMES } from '../constants'
import {
  SearchIcon,
  FilterIcon,
  ImageIcon,
  RotateCcwIcon,
  XIcon,
  Edit3Icon,
  Trash2Icon,
  ExternalLinkIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
} from './Icons'

const outcomeStyles = {
  Win: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  Loss: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  Breakeven: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
}

export default function JournalTable({ entries, onUpdate, onDelete }) {
  const [filters, setFilters] = useState({ query: '', outcome: '', from: '', to: '' })
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const q = filters.query.toLowerCase().trim()
      if (q) {
        const matchPair = e.pair?.toLowerCase().includes(q)
        const matchStrategy = e.strategy?.toLowerCase().includes(q)
        const matchNotes = e.notes?.toLowerCase().includes(q)
        if (!matchPair && !matchStrategy && !matchNotes) return false
      }
      if (filters.outcome && e.outcome !== filters.outcome) return false
      if (filters.from && e.date < filters.from) return false
      if (filters.to && e.date > filters.to) return false
      return true
    })
  }, [entries, filters])

  const hasActiveFilters = Boolean(
    filters.query || filters.outcome || filters.from || filters.to
  )

  function resetFilters() {
    setFilters({ query: '', outcome: '', from: '', to: '' })
  }

  function handleSaveEdit(updatedEntry, imageBase64) {
    if (!selectedTrade) return
    onUpdate(selectedTrade.id, updatedEntry, imageBase64)
    setIsEditing(false)
    setSelectedTrade({ ...selectedTrade, ...updatedEntry })
  }

  function confirmDelete(id) {
    onDelete(id)
    setDeletingId(null)
    if (selectedTrade?.id === id) {
      setSelectedTrade(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Query */}
          <div className="relative flex-1 min-w-[240px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search pair, strategy, confluences..."
              value={filters.query}
              onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          {/* Outcome Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-950/80 border border-zinc-800">
            <button
              onClick={() => setFilters((p) => ({ ...p, outcome: '' }))}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                !filters.outcome
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({entries.length})
            </button>
            {OUTCOMES.map((o) => (
              <button
                key={o}
                onClick={() => setFilters((p) => ({ ...p, outcome: p.outcome === o ? '' : o }))}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  filters.outcome === o
                    ? o === 'Win'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : o === 'Loss'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {o}
              </button>
            ))}
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
              className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-indigo-500/80 focus:outline-none"
            />
            <span className="text-zinc-600">to</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
              className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-indigo-500/80 focus:outline-none"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800/60 transition-colors"
            >
              <RotateCcwIcon className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Journal Data Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800/80 text-sm">
            <thead className="bg-zinc-950/70 text-left text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Pair</th>
                <th className="px-4 py-3.5">Strategy</th>
                <th className="px-4 py-3.5">Timeframe</th>
                <th className="px-4 py-3.5">Outcome</th>
                <th className="px-4 py-3.5 text-right">PnL</th>
                <th className="px-4 py-3.5 text-right">R-Multiple</th>
                <th className="px-4 py-3.5 text-center">Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filtered.map((entry) => {
                const pnlNum = Number(entry.pnl)
                const rNum = Number(entry.rMultiple)
                const isSelected = selectedTrade?.id === entry.id

                return (
                  <tr
                    key={entry.id}
                    onClick={() => {
                      setSelectedTrade(entry)
                      setIsEditing(false)
                    }}
                    className={`group cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-indigo-500/10 hover:bg-indigo-500/15'
                        : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    <td className="px-4 py-3.5 text-zinc-400 font-mono text-xs whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="px-4 py-3.5 font-sans font-semibold text-zinc-100 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500/80"></span>
                        {entry.pair}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-sans text-zinc-300 text-xs whitespace-nowrap">
                      {entry.strategy ? (
                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-300 border border-zinc-700/50">
                          {entry.strategy}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-400 text-xs whitespace-nowrap">
                      {entry.timeframe || '—'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-sans font-medium ${
                          outcomeStyles[entry.outcome] ?? 'text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {entry.outcome === 'Win' && <ArrowUpRightIcon className="w-3 h-3 text-emerald-400" />}
                        {entry.outcome === 'Loss' && <ArrowDownRightIcon className="w-3 h-3 text-rose-400" />}
                        {entry.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {!isNaN(pnlNum) && entry.pnl !== '' ? (
                        <span
                          className={`font-semibold ${
                            pnlNum > 0
                              ? 'text-emerald-400'
                              : pnlNum < 0
                              ? 'text-rose-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {pnlNum > 0 ? `+${pnlNum.toFixed(2)}` : pnlNum.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {!isNaN(rNum) && entry.rMultiple !== '' ? (
                        <span
                          className={`font-medium ${
                            rNum > 0
                              ? 'text-emerald-400'
                              : rNum < 0
                              ? 'text-rose-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {rNum > 0 ? `+${rNum.toFixed(2)}R` : `${rNum.toFixed(2)}R`}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {entry.chartImageUrl ? (
                        <span className="inline-flex items-center justify-center p-1 rounded bg-indigo-500/10 text-indigo-400">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FilterIcon className="w-6 h-6 text-zinc-600" />
                      <p className="text-sm font-medium text-zinc-400">No trades match your search filters</p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Trade Inspection Drawer / Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl overflow-y-auto p-6 space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      outcomeStyles[selectedTrade.outcome] ?? 'text-zinc-400'
                    }`}
                  >
                    {selectedTrade.outcome}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      {selectedTrade.pair}
                      {selectedTrade.timeframe && (
                        <span className="text-xs font-mono font-normal text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                          {selectedTrade.timeframe}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-zinc-500 font-mono">{selectedTrade.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTrade(null)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Edit Mode vs Read-only Mode */}
              {isEditing ? (
                <div className="py-4">
                  <LogEntryForm
                    initialEntry={selectedTrade}
                    submitLabel="Save Changes"
                    onSubmit={handleSaveEdit}
                    onCancel={() => setIsEditing(false)}
                  />
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MetricBox
                      label="PnL"
                      value={selectedTrade.pnl ? `$${selectedTrade.pnl}` : '—'}
                      highlight={
                        Number(selectedTrade.pnl) > 0
                          ? 'emerald'
                          : Number(selectedTrade.pnl) < 0
                          ? 'rose'
                          : 'zinc'
                      }
                    />
                    <MetricBox
                      label="R-Multiple"
                      value={selectedTrade.rMultiple ? `${selectedTrade.rMultiple} R` : '—'}
                      highlight={
                        Number(selectedTrade.rMultiple) > 0
                          ? 'emerald'
                          : Number(selectedTrade.rMultiple) < 0
                          ? 'rose'
                          : 'zinc'
                      }
                    />
                    <MetricBox label="Strategy" value={selectedTrade.strategy || '—'} />
                    <MetricBox label="Timeframe" value={selectedTrade.timeframe || '—'} />
                  </div>

                  {/* Level Details */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Price Levels
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-sm">
                      <LevelItem label="Entry Price" value={selectedTrade.entryPrice} />
                      <LevelItem label="Exit Price" value={selectedTrade.exitPrice} />
                      <LevelItem label="Stop Loss" value={selectedTrade.stopLoss} color="rose" />
                      <LevelItem label="Take Profit" value={selectedTrade.takeProfit} color="emerald" />
                    </div>
                  </div>

                  {/* Setup & Confluences */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Technical Confluences
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-xs text-zinc-500 block">Indicators</span>
                        <p className="text-zinc-300">{selectedTrade.indicators || 'None specified'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 block">Entry Trigger</span>
                        <p className="text-zinc-300">{selectedTrade.entryTrigger || 'None specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trade Notes */}
                  {selectedTrade.notes && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Notes & Observations
                      </h3>
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{selectedTrade.notes}</p>
                    </div>
                  )}

                  {/* Chart Snapshot View */}
                  {selectedTrade.chartImageUrl && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Chart Snapshot
                        </h3>
                        <a
                          href={selectedTrade.chartImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          <span>Full resolution</span>
                          <ExternalLinkIcon className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <a href={selectedTrade.chartImageUrl} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={selectedTrade.chartImageUrl}
                          alt="Chart snapshot"
                          className="w-full max-h-80 object-contain rounded-lg border border-zinc-800/80 bg-zinc-950"
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {!isEditing && (
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setDeletingId(selectedTrade.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/30 px-3.5 py-2 text-xs font-medium text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
                >
                  <Trash2Icon className="w-4 h-4" />
                  Delete Trade
                </button>

                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Edit3Icon className="w-4 h-4" />
                  Edit Trade
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-zinc-100">Delete Trade Entry</h3>
            <p className="text-sm text-zinc-400">
              Are you sure you want to permanently delete this trade entry? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deletingId)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricBox({ label, value, highlight }) {
  let textClass = 'text-zinc-100'
  if (highlight === 'emerald') textClass = 'text-emerald-400 font-bold'
  if (highlight === 'rose') textClass = 'text-rose-400 font-bold'

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-sm font-mono truncate ${textClass}`}>{value}</p>
    </div>
  )
}

function LevelItem({ label, value, color }) {
  let valColor = 'text-zinc-200'
  if (color === 'rose') valColor = 'text-rose-400'
  if (color === 'emerald') valColor = 'text-emerald-400'

  return (
    <div>
      <span className="text-[11px] text-zinc-500 block uppercase tracking-wider">{label}</span>
      <span className={`font-semibold ${valColor}`}>{value ? value : '—'}</span>
    </div>
  )
}
