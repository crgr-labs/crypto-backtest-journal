import { useEffect, useRef, useState } from 'react'
import { EMPTY_ENTRY, OUTCOMES } from '../constants'
import {
  UploadCloudIcon,
  XIcon,
  CheckIcon,
  ChevronDownIcon,
} from './Icons'

const OUTCOME_LABELS = { Win: 'W', Loss: 'L', Breakeven: 'BE' }

const outcomeActiveStyles = {
  Win: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  Loss: 'border-rose-300 bg-rose-50 text-rose-700',
  Breakeven: 'border-amber-300 bg-amber-50 text-amber-700',
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const cellInput =
  'w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 hover:border-slate-200 hover:bg-slate-50/70 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all'

export default function QuickLogTable({ onSubmit }) {
  const [entry, setEntry] = useState(EMPTY_ENTRY)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const dateInputRef = useRef(null)
  const fileInputRef = useRef(null)

  function handleChange(name, value) {
    setEntry((prev) => ({ ...prev, [name]: value }))
  }

  // Auto-compute R-Multiple & Outcome the moment entry/exit/stop are known — no manual button needed.
  useEffect(() => {
    const entryP = parseFloat(entry.entryPrice)
    const exitP = parseFloat(entry.exitPrice)
    const slP = parseFloat(entry.stopLoss)
    if (isNaN(entryP) || isNaN(slP) || isNaN(exitP)) return

    const risk = Math.abs(entryP - slP)
    if (risk === 0) return

    const isLong = entryP >= slP
    const reward = isLong ? exitP - entryP : entryP - exitP
    const calcR = +(reward / risk).toFixed(2)
    if (!isFinite(calcR)) return

    setEntry((prev) => ({
      ...prev,
      rMultiple: calcR.toString(),
      outcome: calcR > 0 ? 'Win' : calcR < 0 ? 'Loss' : 'Breakeven',
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.entryPrice, entry.exitPrice, entry.stopLoss])

  function handleFileSelect(file) {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function resetRow() {
    setEntry(EMPTY_ENTRY)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    dateInputRef.current?.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!entry.date || !entry.pair) {
      setError('Date and Pair are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const imageBase64 = imageFile ? await fileToBase64(imageFile) : undefined
      await onSubmit(entry, imageBase64)
      setSavedCount((c) => c + 1)
      resetRow()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-3">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Log Trade</h2>
          <span className="text-xs text-slate-400">
            Fill the row and press <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono">Enter</kbd> to save & add another
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-2 py-2 w-[136px]">Date</th>
                <th className="px-2 py-2 w-[110px]">Pair</th>
                <th className="px-2 py-2 w-[84px]">TF</th>
                <th className="px-2 py-2 w-[130px]">Strategy</th>
                <th className="px-2 py-2 w-[90px] text-right">Entry</th>
                <th className="px-2 py-2 w-[90px] text-right">Exit</th>
                <th className="px-2 py-2 w-[90px] text-right text-rose-600">SL</th>
                <th className="px-2 py-2 w-[90px] text-right text-emerald-600">TP</th>
                <th className="px-2 py-2 w-[90px] text-right">PnL</th>
                <th className="px-2 py-2 w-[70px] text-right">R</th>
                <th className="px-2 py-2 w-[110px] text-center">Outcome</th>
                <th className="px-2 py-2 w-[36px]"></th>
                <th className="px-2 py-2 w-[44px]"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-1">
                  <input
                    ref={dateInputRef}
                    type="date"
                    required
                    value={entry.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className={cellInput}
                  />
                </td>
                <td className="px-1">
                  <input
                    type="text"
                    required
                    placeholder="BTC/USDT"
                    value={entry.pair}
                    onChange={(e) => handleChange('pair', e.target.value)}
                    className={`${cellInput} font-mono`}
                  />
                </td>
                <td className="px-1">
                  <input
                    type="text"
                    placeholder="1h"
                    value={entry.timeframe}
                    onChange={(e) => handleChange('timeframe', e.target.value)}
                    className={`${cellInput} font-mono`}
                  />
                </td>
                <td className="px-1">
                  <input
                    type="text"
                    placeholder="Breakout Retest"
                    value={entry.strategy}
                    onChange={(e) => handleChange('strategy', e.target.value)}
                    className={cellInput}
                  />
                </td>
                <td className="px-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={entry.entryPrice}
                    onChange={(e) => handleChange('entryPrice', e.target.value)}
                    className={`${cellInput} font-mono text-right`}
                  />
                </td>
                <td className="px-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={entry.exitPrice}
                    onChange={(e) => handleChange('exitPrice', e.target.value)}
                    className={`${cellInput} font-mono text-right`}
                  />
                </td>
                <td className="px-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={entry.stopLoss}
                    onChange={(e) => handleChange('stopLoss', e.target.value)}
                    className={`${cellInput} font-mono text-right`}
                  />
                </td>
                <td className="px-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={entry.takeProfit}
                    onChange={(e) => handleChange('takeProfit', e.target.value)}
                    className={`${cellInput} font-mono text-right`}
                  />
                </td>
                <td className="px-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={entry.pnl}
                    onChange={(e) => handleChange('pnl', e.target.value)}
                    className={`${cellInput} font-mono text-right`}
                  />
                </td>
                <td className="px-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.0"
                    value={entry.rMultiple}
                    onChange={(e) => handleChange('rMultiple', e.target.value)}
                    className={`${cellInput} font-mono text-right`}
                    title="Auto-computed from Entry/Exit/SL — editable"
                  />
                </td>
                <td className="px-1">
                  <div className="flex items-center justify-center gap-1">
                    {OUTCOMES.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => handleChange('outcome', o)}
                        title={o}
                        className={`h-6 min-w-[24px] rounded border text-[10px] font-semibold transition-colors cursor-pointer ${
                          entry.outcome === o
                            ? outcomeActiveStyles[o]
                            : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                        }`}
                      >
                        {OUTCOME_LABELS[o]}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-1 text-center">
                  <button
                    type="button"
                    onClick={() => setShowDetails((v) => !v)}
                    title="More details (indicators, notes, chart)"
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors cursor-pointer ${
                      showDetails
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                        : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                  </button>
                </td>
                <td className="px-1 text-center">
                  <button
                    type="submit"
                    disabled={saving}
                    title="Save trade"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {saving ? (
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                    ) : (
                      <CheckIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {showDetails && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Indicators Used</label>
                <input
                  type="text"
                  placeholder="e.g. 200 EMA, RSI Divergence, Volume Spike"
                  value={entry.indicators}
                  onChange={(e) => handleChange('indicators', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Entry Trigger / Confluence</label>
                <input
                  type="text"
                  placeholder="e.g. Liquidity sweep + 5m change of character"
                  value={entry.entryTrigger}
                  onChange={(e) => handleChange('entryTrigger', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes & Lessons Learned</label>
              <textarea
                rows={2}
                placeholder="What went well? Did you adhere strictly to your rules?"
                value={entry.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Chart Snapshot</label>
              {imagePreview ? (
                <div className="relative rounded-lg border border-slate-200 bg-white p-2 max-w-sm">
                  <img src={imagePreview} alt="Chart preview" className="max-h-40 w-full object-contain rounded-md" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors shadow-sm cursor-pointer"
                  >
                    <XIcon className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    handleFileSelect(e.dataTransfer.files?.[0])
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-xs cursor-pointer transition-all max-w-sm ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <UploadCloudIcon className="w-4 h-4 text-slate-400" />
                  <span>Click, drag & drop, or Ctrl+V to paste a screenshot</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="border-t border-rose-100 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">{error}</div>
        )}
      </form>

      {savedCount > 0 && (
        <p className="text-xs text-slate-400 text-center">
          {savedCount} trade{savedCount === 1 ? '' : 's'} logged this session
        </p>
      )}
    </div>
  )
}
