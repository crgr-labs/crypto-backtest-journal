import { useMemo, useState } from 'react'
import LogEntryForm from './LogEntryForm'
import { OUTCOMES } from '../constants'
import { getTagStyles } from '../lib/tagColor'
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
  Win: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  Loss: 'bg-rose-50 text-rose-700 border-rose-200/80',
  Breakeven: 'bg-amber-50 text-amber-700 border-amber-200/80',
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
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Query */}
          <div className="relative flex-1 min-w-[240px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search pair, strategy, confluences..."
              value={filters.query}
              onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Outcome Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200/60">
            <button
              onClick={() => setFilters((p) => ({ ...p, outcome: '' }))}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                !filters.outcome
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({entries.length})
            </button>
            {OUTCOMES.map((o) => (
              <button
                key={o}
                onClick={() => setFilters((p) => ({ ...p, outcome: p.outcome === o ? '' : o }))}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  filters.outcome === o
                    ? o === 'Win'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs font-semibold'
                      : o === 'Loss'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs font-semibold'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {o}
              </button>
            ))}
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcwIcon className="w-3.5 h-3.5 text-slate-500" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Journal Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">Chart</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Pair</th>
                <th className="px-4 py-3.5">Strategy</th>
                <th className="px-4 py-3.5">Timeframe</th>
                <th className="px-4 py-3.5">Outcome</th>
                <th className="px-4 py-3.5 text-right">PnL</th>
                <th className="px-4 py-3.5 text-right">R-Multiple</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                        ? 'bg-indigo-50/50 hover:bg-indigo-50/70'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Thumbnail Column */}
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      {entry.chartImageUrl ? (
                        <img
                          src={entry.chartImageUrl}
                          alt="Thumbnail"
                          className="h-10 w-10 mx-auto rounded-lg object-cover border border-slate-200 shadow-2xs group-hover:border-indigo-300 transition-colors"
                        />
                      ) : (
                        <div className="h-10 w-10 mx-auto rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {entry.date}
                    </td>

                    {/* Pair with Tag Chip */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getTagStyles(
                          entry.pair
                        )}`}
                      >
                        {entry.pair}
                      </span>
                    </td>

                    {/* Strategy with Tag Chip */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {entry.strategy ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getTagStyles(
                            entry.strategy
                          )}`}
                        >
                          {entry.strategy}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                      {entry.timeframe || '—'}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          outcomeStyles[entry.outcome] ?? 'text-slate-600 border-slate-200'
                        }`}
                      >
                        {entry.outcome === 'Win' && (
                          <ArrowUpRightIcon className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {entry.outcome === 'Loss' && (
                          <ArrowDownRightIcon className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        {entry.outcome}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {!isNaN(pnlNum) && entry.pnl !== '' ? (
                        <span
                          className={`font-semibold ${
                            pnlNum > 0
                              ? 'text-emerald-600'
                              : pnlNum < 0
                              ? 'text-rose-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {pnlNum > 0 ? `+${pnlNum.toFixed(2)}` : pnlNum.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {!isNaN(rNum) && entry.rMultiple !== '' ? (
                        <span
                          className={`font-medium ${
                            rNum > 0
                              ? 'text-emerald-600 font-semibold'
                              : rNum < 0
                              ? 'text-rose-600 font-semibold'
                              : 'text-slate-600'
                          }`}
                        >
                          {rNum > 0 ? `+${rNum.toFixed(2)}R` : `${rNum.toFixed(2)}R`}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FilterIcon className="w-6 h-6 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No trades match your search filters</p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
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
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl h-full bg-white border-l border-slate-200 shadow-2xl overflow-y-auto p-6 space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      outcomeStyles[selectedTrade.outcome] ?? 'text-slate-600'
                    }`}
                  >
                    {selectedTrade.outcome}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {selectedTrade.pair}
                      {selectedTrade.timeframe && (
                        <span className="text-xs font-mono font-normal text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {selectedTrade.timeframe}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">{selectedTrade.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTrade(null)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
                          : 'slate'
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
                          : 'slate'
                      }
                    />
                    <MetricBox label="Strategy" value={selectedTrade.strategy || '—'} />
                    <MetricBox label="Timeframe" value={selectedTrade.timeframe || '—'} />
                  </div>

                  {/* Level Details */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Technical Confluences
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-xs text-slate-500 block">Indicators</span>
                        <p className="text-slate-800 font-medium">{selectedTrade.indicators || 'None specified'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Entry Trigger</span>
                        <p className="text-slate-800 font-medium">{selectedTrade.entryTrigger || 'None specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trade Notes */}
                  {selectedTrade.notes && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Notes & Observations
                      </h3>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTrade.notes}</p>
                    </div>
                  )}

                  {/* Chart Snapshot View */}
                  {selectedTrade.chartImageUrl && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Chart Snapshot
                        </h3>
                        <a
                          href={selectedTrade.chartImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          <span>Full resolution</span>
                          <ExternalLinkIcon className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <a href={selectedTrade.chartImageUrl} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={selectedTrade.chartImageUrl}
                          alt="Chart snapshot"
                          className="w-full max-h-80 object-contain rounded-lg border border-slate-200 bg-white shadow-xs"
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {!isEditing && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => setDeletingId(selectedTrade.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <Trash2Icon className="w-4 h-4" />
                  Delete Trade
                </button>

                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Delete Trade Entry</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete this trade entry? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deletingId)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer"
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
  let textClass = 'text-slate-900'
  if (highlight === 'emerald') textClass = 'text-emerald-600 font-bold'
  if (highlight === 'rose') textClass = 'text-rose-600 font-bold'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-mono truncate ${textClass}`}>{value}</p>
    </div>
  )
}

function LevelItem({ label, value, color }) {
  let valColor = 'text-slate-800'
  if (color === 'rose') valColor = 'text-rose-600'
  if (color === 'emerald') valColor = 'text-emerald-600'

  return (
    <div>
      <span className="text-[11px] text-slate-500 block uppercase tracking-wider">{label}</span>
      <span className={`font-semibold ${valColor}`}>{value ? value : '—'}</span>
    </div>
  )
}
