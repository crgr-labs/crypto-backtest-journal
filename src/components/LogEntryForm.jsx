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
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              1
            </span>
            <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              Trade Information
            </h2>
          </div>
          <span className="text-xs text-zinc-500">Asset, timeframe & classification</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={entry.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Pair / Ticker <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BTC/USDT, ETH/USD"
              value={entry.pair}
              onChange={(e) => handleChange('pair', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Timeframe</label>
            <input
              type="text"
              placeholder="e.g. 15m, 1h, 4h, 1D"
              value={entry.timeframe}
              onChange={(e) => handleChange('timeframe', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Strategy / Model</label>
            <input
              type="text"
              placeholder="e.g. Breakout Retest, FVG"
              value={entry.strategy}
              onChange={(e) => handleChange('strategy', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Price Levels & Execution */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              2
            </span>
            <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              Execution Levels
            </h2>
          </div>
          <button
            type="button"
            onClick={autoCalculateMetrics}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            title="Compute R-Multiple based on Entry, Exit, and Stop Loss"
          >
            <CalculatorIcon className="w-3.5 h-3.5" />
            <span>Auto-compute R</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Entry Price</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={entry.entryPrice}
              onChange={(e) => handleChange('entryPrice', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Exit Price</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={entry.exitPrice}
              onChange={(e) => handleChange('exitPrice', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-rose-400/90 mb-1.5">Stop Loss</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={entry.stopLoss}
              onChange={(e) => handleChange('stopLoss', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-emerald-400/90 mb-1.5">Take Profit</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={entry.takeProfit}
              onChange={(e) => handleChange('takeProfit', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. Setup, Triggers & Indicators */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              3
            </span>
            <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              Technical Setup & Confluences
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Indicators Used</label>
            <input
              type="text"
              placeholder="e.g. 200 EMA, RSI Divergence, Volume Spike"
              value={entry.indicators}
              onChange={(e) => handleChange('indicators', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Entry Trigger / Confluence</label>
            <input
              type="text"
              placeholder="e.g. Liquidity sweep + 5m change of character"
              value={entry.entryTrigger}
              onChange={(e) => handleChange('entryTrigger', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 4. Outcome & Performance */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              4
            </span>
            <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              Trade Outcome
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Outcome Status</label>
            <div className="grid grid-cols-3 gap-2.5 max-w-md">
              {OUTCOMES.map((o) => {
                const isSelected = entry.outcome === o
                let activeColor = ''
                if (o === 'Win') {
                  activeColor = isSelected
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/50'
                    : 'hover:border-zinc-700 text-zinc-400'
                } else if (o === 'Loss') {
                  activeColor = isSelected
                    ? 'border-rose-500/50 bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/50'
                    : 'hover:border-zinc-700 text-zinc-400'
                } else {
                  activeColor = isSelected
                    ? 'border-zinc-500/50 bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-500/50'
                    : 'hover:border-zinc-700 text-zinc-400'
                }

                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => handleChange('outcome', o)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                      isSelected ? activeColor : 'border-zinc-800 bg-zinc-950/60'
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Net PnL ($ / USDT)</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 250 or -100"
                value={entry.pnl}
                onChange={(e) => handleChange('pnl', e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">R-Multiple Realized</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 2.5 or -1.0"
                value={entry.rMultiple}
                onChange={(e) => handleChange('rMultiple', e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Notes & Lessons Learned
            </label>
            <textarea
              rows={3}
              placeholder="What went well? Did you adhere strictly to your rules? Any emotional triggers?"
              value={entry.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all resize-y"
            />
          </div>
        </div>
      </div>

      {/* 5. Chart Snapshot Dropzone & Clipboard Paste */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              5
            </span>
            <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              Chart Snapshot
            </h2>
          </div>
          <span className="text-xs text-zinc-500">Supports drag & drop or Ctrl+V paste</span>
        </div>

        {imagePreview ? (
          <div className="relative rounded-lg border border-zinc-800 bg-zinc-950/80 p-2 group max-w-xl">
            <img
              src={imagePreview}
              alt="Chart preview"
              className="max-h-72 w-full object-contain rounded-md"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-4 right-4 flex items-center gap-1 rounded-md bg-zinc-900/90 border border-zinc-700/80 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-950/80 transition-colors shadow-lg"
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
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-950/80'
            }`}
          >
            <UploadCloudIcon className="w-8 h-8 text-zinc-500 mb-2" />
            <p className="text-sm font-medium text-zinc-300">
              Click to browse, drag & drop, or <span className="text-indigo-400">Ctrl+V</span> to paste
            </p>
            <p className="text-xs text-zinc-500 mt-1">PNG, JPG, WebP screenshot files</p>
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
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 transition-all cursor-pointer"
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
