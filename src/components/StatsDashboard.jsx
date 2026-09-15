import { useMemo } from 'react'
import { BarChart3Icon } from './Icons'
import { getTagStyles } from '../lib/tagColor'

function computeStats(entries) {
  const total = entries.length
  const wins = entries.filter((e) => e.outcome === 'Win').length
  const losses = entries.filter((e) => e.outcome === 'Loss').length
  const breakevens = entries.filter((e) => e.outcome === 'Breakeven').length
  const winRate = total ? (wins / total) * 100 : 0

  const rValues = entries
    .map((e) => Number(e.rMultiple))
    .filter((n) => !Number.isNaN(n) && n !== 0)
  const totalR = rValues.reduce((a, b) => a + b, 0)
  const avgR = rValues.length ? totalR / rValues.length : 0

  const pnlList = entries.map((e) => Number(e.pnl)).filter((n) => !Number.isNaN(n))
  const pnlSum = pnlList.reduce((a, b) => a + b, 0)

  // Profit Factor = Total Wins $ / Total Losses $
  const grossProfit = pnlList.filter((p) => p > 0).reduce((a, b) => a + b, 0)
  const grossLoss = Math.abs(pnlList.filter((p) => p < 0).reduce((a, b) => a + b, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

  return {
    total,
    wins,
    losses,
    breakevens,
    winRate,
    avgR,
    totalR,
    pnlSum,
    profitFactor,
  }
}

function groupStats(entries, key) {
  const groups = {}
  for (const entry of entries) {
    const label = entry[key] || 'Unspecified'
    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  }
  return Object.entries(groups)
    .map(([label, group]) => ({ label, ...computeStats(group) }))
    .sort((a, b) => b.total - a.total)
}

export default function StatsDashboard({ entries }) {
  const overall = useMemo(() => computeStats(entries), [entries])
  const byPair = useMemo(() => groupStats(entries, 'pair'), [entries])
  const byStrategy = useMemo(() => groupStats(entries, 'strategy'), [entries])

  // Chronological equity curve calculation
  const equityPoints = useMemo(() => {
    if (!entries.length) return []
    // Sort entries by date ascending
    const sorted = [...entries].sort((a, b) => (a.date > b.date ? 1 : -1))
    let cumPnL = 0
    return sorted.map((e, idx) => {
      cumPnL += Number(e.pnl) || 0
      return {
        index: idx + 1,
        date: e.date,
        pnl: Number(e.pnl) || 0,
        cumPnL: +cumPnL.toFixed(2),
      }
    })
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
        <BarChart3Icon className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-base font-semibold text-slate-700">No trading data available</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          Log backtested trades to generate real-time performance analytics, win rate metrics, and equity curves.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Trades */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Trades</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900">{overall.total}</span>
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
              <span className="text-emerald-700 font-semibold">{overall.wins}W</span>
              <span className="text-slate-300">·</span>
              <span className="text-rose-700 font-semibold">{overall.losses}L</span>
              <span className="text-slate-300">·</span>
              <span className="text-amber-700 font-semibold">{overall.breakevens}BE</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400 font-mono">
            {overall.wins + overall.losses > 0
              ? `${((overall.wins / (overall.wins + overall.losses || 1)) * 100).toFixed(0)}% decision accuracy`
              : 'Logged backtest sessions'}
          </p>
        </div>

        {/* Win Rate with Donut Ring Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Win Rate</p>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono text-slate-900">
                {overall.winRate.toFixed(1)}%
              </span>
            </div>
            <p className="mt-3 text-xs font-mono text-slate-500">
              <span className="font-semibold text-emerald-700">{overall.wins}</span> of{' '}
              <span className="font-semibold text-slate-700">{overall.total}</span> won
            </p>
          </div>
          <WinRateDonut winRate={overall.winRate} />
        </div>

        {/* Total Cumulative PnL */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Cumulative PnL</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-3xl font-bold font-mono ${
                overall.pnlSum > 0
                  ? 'text-emerald-600'
                  : overall.pnlSum < 0
                  ? 'text-rose-600'
                  : 'text-slate-900'
              }`}
            >
              {overall.pnlSum > 0
                ? `+$${overall.pnlSum.toFixed(2)}`
                : `$${overall.pnlSum.toFixed(2)}`}
            </span>
            <span
              className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                overall.totalR >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {overall.totalR >= 0 ? `+${overall.totalR.toFixed(1)}R` : `${overall.totalR.toFixed(1)}R`}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400 font-mono">
            Avg trade:{' '}
            <strong className="text-slate-700">
              {overall.total ? `$${(overall.pnlSum / overall.total).toFixed(2)}` : '$0.00'}
            </strong>
          </p>
        </div>

        {/* Avg R & Profit Factor */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Expectancy & Factor
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900">
              {overall.avgR >= 0 ? `+${overall.avgR.toFixed(2)}` : overall.avgR.toFixed(2)}
              <span className="text-lg font-normal text-slate-400 ml-0.5">R</span>
            </span>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              PF:{' '}
              <strong className="text-slate-900 font-semibold">
                {isFinite(overall.profitFactor) ? overall.profitFactor.toFixed(2) : '∞'}
              </strong>
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400 font-mono">
            Average reward per unit risk
          </p>
        </div>
      </div>

      {/* Cumulative PnL Equity Curve Graph */}
      {equityPoints.length > 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Cumulative Equity Curve
              </h3>
              <p className="text-xs text-slate-500">PnL progression over backtested trades</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-mono">Net Balance: </span>
              <span
                className={`text-sm font-mono font-bold ${
                  overall.pnlSum >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {overall.pnlSum >= 0 ? `+$${overall.pnlSum.toFixed(2)}` : `$${overall.pnlSum.toFixed(2)}`}
              </span>
            </div>
          </div>

          <EquityCurveChart points={equityPoints} />
        </div>
      )}

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceTable title="Performance by Strategy" items={byStrategy} type="strategy" />
        <PerformanceTable title="Performance by Asset Pair" items={byPair} type="pair" />
      </div>
    </div>
  )
}

function WinRateDonut({ winRate }) {
  const size = 68
  const strokeWidth = 7
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, winRate)) / 100) * circumference

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#4f46e5"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-bold font-mono text-indigo-700">
        {winRate.toFixed(0)}%
      </span>
    </div>
  )
}

function EquityCurveChart({ points }) {
  if (points.length < 2) return null

  const pnlValues = points.map((p) => p.cumPnL)
  const minVal = Math.min(0, ...pnlValues)
  const maxVal = Math.max(10, ...pnlValues)
  const range = maxVal - minVal || 1

  const width = 800
  const height = 180
  const paddingY = 20
  const paddingX = 20

  const getX = (idx) => paddingX + (idx / (points.length - 1)) * (width - 2 * paddingX)
  const getY = (val) => height - paddingY - ((val - minVal) / range) * (height - 2 * paddingY)

  const zeroY = getY(0)

  // Construct SVG Path
  const pathD = points.reduce((acc, pt, idx) => {
    const x = getX(idx)
    const y = getY(pt.cumPnL)
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`
  }, '')

  // Area under curve path
  const areaD = `${pathD} L ${getX(points.length - 1)} ${zeroY} L ${getX(0)} ${zeroY} Z`

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44 text-slate-200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="equityGradLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Zero baseline */}
        <line
          x1={paddingX}
          y1={zeroY}
          x2={width - paddingX}
          y2={zeroY}
          stroke="#cbd5e1"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />

        {/* Filled Area */}
        <path d={areaD} fill="url(#equityGradLight)" />

        {/* Curve Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((pt, idx) => (
          <circle
            key={idx}
            cx={getX(idx)}
            cy={getY(pt.cumPnL)}
            r="3.5"
            className="fill-indigo-600 stroke-white stroke-2"
          />
        ))}
      </svg>
    </div>
  )
}

function PerformanceTable({ title, items, type }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 font-semibold bg-slate-50/50">
            <tr>
              <th className="py-2.5 px-3">{type === 'strategy' ? 'Strategy' : 'Pair'}</th>
              <th className="py-2.5 px-3 text-center">Trades</th>
              <th className="py-2.5 px-3">Win Rate</th>
              <th className="py-2.5 px-3 text-right">Avg R</th>
              <th className="py-2.5 px-3 text-right">PnL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {items.map((row) => (
              <tr key={row.label} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getTagStyles(
                      row.label
                    )}`}
                  >
                    {row.label}
                  </span>
                </td>
                <td className="py-3 px-3 text-center text-slate-600 font-mono">
                  {row.total}{' '}
                  <span className="text-[10px] text-slate-400">
                    ({row.wins}W/{row.losses}L)
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-9 text-slate-800 font-semibold">{row.winRate.toFixed(0)}%</span>
                    <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${row.winRate}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <span
                    className={
                      row.avgR > 0
                        ? 'text-emerald-600 font-semibold'
                        : row.avgR < 0
                        ? 'text-rose-600 font-semibold'
                        : 'text-slate-600'
                    }
                  >
                    {row.avgR > 0 ? `+${row.avgR.toFixed(2)}` : row.avgR.toFixed(2)}R
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span
                    className={`font-semibold ${
                      row.pnlSum > 0
                        ? 'text-emerald-600'
                        : row.pnlSum < 0
                        ? 'text-rose-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {row.pnlSum > 0 ? `+$${row.pnlSum.toFixed(2)}` : `$${row.pnlSum.toFixed(2)}`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
