import { useState, useEffect, useRef } from 'react'
import { EMPTY_ENTRY, OUTCOMES } from '../constants'
import {
  UploadCloudIcon,
  XIcon,
  CalculatorIcon,
  CheckIcon,
} from './Icons'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function LogEntryForm({
  onSubmit,
  initialEntry,
  submitLabel = 'Save Trade Entry',
  onCancel,
}) {
  const [entry, setEntry] = useState(initialEntry ?? EMPTY_ENTRY)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(initialEntry?.chartImageUrl || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // Sync state if initialEntry changes
  useEffect(() => {
    if (initialEntry) {
      setEntry(initialEntry)
      setImagePreview(initialEntry.chartImageUrl || null)
    }
  }, [initialEntry])

  // Clipboard image paste support (Ctrl+V)
  useEffect(() => {
    function handlePaste(e) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  function handleChange(name, value) {
    setEntry((prev) => ({ ...prev, [name]: value }))
  }

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
    if (entry.chartImageUrl) {
      handleChange('chartImageUrl', '')
    }
  }

  // Smart calculate R:R and suggest R-multiple
  function autoCalculateMetrics() {
    const entryP = parseFloat(entry.entryPrice)
    const exitP = parseFloat(entry.exitPrice)
    const slP = parseFloat(entry.stopLoss)

    if (isNaN(entryP) || isNaN(slP)) return

    const risk = Math.abs(entryP - slP)
    if (risk === 0) return

    let reward = 0
    let calcR = 0

    if (!isNaN(exitP)) {
      const isLong = entryP >= slP
      reward = isLong ? exitP - entryP : entryP - exitP
      calcR = +(reward / risk).toFixed(2)
    }

    if (!isNaN(calcR) && isFinite(calcR)) {
      handleChange('rMultiple', calcR.toString())
      if (calcR > 0) handleChange('outcome', 'Win')
      else if (calcR < 0) handleChange('outcome', 'Loss')
      else handleChange('outcome', 'Breakeven')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const imageBase64 = imageFile ? await fileToBase64(imageFile) : undefined
      await onSubmit(entry, imageBase64)
      if (!initialEntry) {
        setEntry(EMPTY_ENTRY)
        setImageFile(null)
        setImagePreview(null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* 1. Trade Meta & Context */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600">
              1
            </span>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Trade Information
            </h2>
          </div>
          <span className="text-xs text-slate-400">Asset, timeframe & classification</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={entry.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Pair / Ticker <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BTC/USDT, ETH/USD"
              value={entry.pair}
              onChange={(e) => handleChange('pair', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Timeframe</label>
            <input
              type="text"
              placeholder="e.g. 15m, 1h, 4h, 1D"
              value={entry.timeframe}
              onChange={(e) => handleChange('timeframe', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Strategy / Model</label>
            <input
              type="text"
              placeholder="e.g. Breakout Retest, FVG"
              value={entry.strategy}
              onChange={(e) => handleChange('strategy', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Price Levels & Execution */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600">
              2
            </span>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Execution Levels
            </h2>
          </div>
          <button
            type="button"
            onClick={autoCalculateMetrics}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
            title="Compute R-Multiple based on Entry, Exit, and Stop Loss"
          >
            <CalculatorIcon className="w-3.5 h-3.5" />
            <span>Auto-compute R</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Entry Price</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={entry.entryPrice}
              onChange={(e) => handleChange('entryPrice', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Exit Price</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={entry.exitPrice}
              onChange={(e) => handleChange('exitPrice', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-700 mb-1.5">Stop Loss</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={entry.stopLoss}
              onChange={(e) => handleChange('stopLoss', e.target.value)}
              className="w-full rounded-lg border border-rose-200 bg-rose-50/30 px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Take Profit</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={entry.takeProfit}
              onChange={(e) => handleChange('takeProfit', e.target.value)}
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50/30 px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. Setup, Triggers & Indicators */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600">
              3
            </span>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Technical Setup & Confluences
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Indicators Used</label>
            <input
              type="text"
              placeholder="e.g. 200 EMA, RSI Divergence, Volume Spike"
              value={entry.indicators}
              onChange={(e) => handleChange('indicators', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Entry Trigger / Confluence</label>
            <input
              type="text"
              placeholder="e.g. Liquidity sweep + 5m change of character"
              value={entry.entryTrigger}
              onChange={(e) => handleChange('entryTrigger', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 4. Outcome & Performance */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600">
              4
            </span>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Trade Outcome
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Outcome Status</label>
            <div className="grid grid-cols-3 gap-2.5 max-w-md">
              {OUTCOMES.map((o) => {
                const isSelected = entry.outcome === o
                let activeColor = ''
                if (o === 'Win') {
                  activeColor = isSelected
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400 font-semibold shadow-xs'
                    : 'hover:border-slate-300 text-slate-600 bg-white border-slate-200'
                } else if (o === 'Loss') {
                  activeColor = isSelected
                    ? 'border-rose-300 bg-rose-50 text-rose-800 ring-1 ring-rose-400 font-semibold shadow-xs'
                    : 'hover:border-slate-300 text-slate-600 bg-white border-slate-200'
                } else {
                  activeColor = isSelected
                    ? 'border-amber-300 bg-amber-50 text-amber-800 ring-1 ring-amber-400 font-semibold shadow-xs'
                    : 'hover:border-slate-300 text-slate-600 bg-white border-slate-200'
                }

                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => handleChange('outcome', o)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-sm transition-all cursor-pointer ${
                      isSelected ? activeColor : 'border-slate-200 bg-white'
                    }`}
                  >
                    {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                    {o}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Net PnL ($ / USDT)</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 250 or -100"
                value={entry.pnl}
                onChange={(e) => handleChange('pnl', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">R-Multiple Realized</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 2.5 or -1.0"
                value={entry.rMultiple}
                onChange={(e) => handleChange('rMultiple', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Notes & Lessons Learned
            </label>
            <textarea
              rows={3}
              placeholder="What went well? Did you adhere strictly to your rules? Any emotional triggers?"
              value={entry.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all resize-y"
            />
          </div>
        </div>
      </div>

      {/* 5. Chart Snapshot Dropzone & Clipboard Paste */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600">
              5
            </span>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Chart Snapshot
            </h2>
          </div>
          <span className="text-xs text-slate-400">Supports drag & drop or Ctrl+V paste</span>
        </div>

        {imagePreview ? (
          <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-2 group max-w-xl">
            <img
              src={imagePreview}
              alt="Chart preview"
              className="max-h-72 w-full object-contain rounded-md"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-4 right-4 flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors shadow-sm cursor-pointer"
            >
              <XIcon className="w-3.5 h-3.5" />
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
              const file = e.dataTransfer.files?.[0]
              handleFileSelect(file)
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <UploadCloudIcon className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Click to browse, drag & drop, or <span className="text-indigo-600 font-semibold">Ctrl+V</span> to paste
            </p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP screenshot files</p>
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

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 transition-all cursor-pointer"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Saving trade…</span>
            </>
          ) : (
            <>
              <CheckIcon className="w-4 h-4" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
