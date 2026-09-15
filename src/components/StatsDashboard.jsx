import { useMemo } from 'react'
import { BarChart3Icon } from './Icons'

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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-16 text-center backdrop-blur-sm">
        <BarChart3Icon className="w-12 h-12 text-zinc-600 mb-3" />
        <h3 className="text-base font-semibold text-zinc-300">No trading data available</h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm">
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
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Trades</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-zinc-100">{overall.total}</span>
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
              <span className="text-emerald-400">{overall.wins}W</span>
              <span className="text-zinc-600">·</span>
              <span className="text-rose-400">{overall.losses}L</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400">{overall.breakevens}BE</span>
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Win Rate</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-zinc-100">
              {overall.winRate.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-zinc-500">
              {overall.wins}/{overall.total} won
            </span>
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, overall.winRate))}%` }}
            ></div>
          </div>
        </div>

        {/* Total Cumulative PnL */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Net Cumulative PnL</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-3xl font-bold font-mono ${
                overall.pnlSum > 0
                  ? 'text-emerald-400'
                  : overall.pnlSum < 0
                  ? 'text-rose-400'
                  : 'text-zinc-100'
              }`}
            >
              {overall.pnlSum > 0
                ? `+$${overall.pnlSum.toFixed(2)}`
                : `$${overall.pnlSum.toFixed(2)}`}
            </span>
            <span
              className={`text-xs font-mono font-medium ${
                overall.totalR >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {overall.totalR >= 0 ? `+${overall.totalR.toFixed(1)}R` : `${overall.totalR.toFixed(1)}R`}
            </span>
          </div>
        </div>

        {/* Avg R & Profit Factor */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Expectancy & Factor
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-zinc-100">
              {overall.avgR >= 0 ? `+${overall.avgR.toFixed(2)}` : overall.avgR.toFixed(2)}
              <span className="text-lg font-normal text-zinc-500 ml-0.5">R</span>
            </span>
            <span className="text-xs font-mono text-zinc-400">
              PF:{' '}
              <span className="text-zinc-200 font-semibold">
                {isFinite(overall.profitFactor) ? overall.profitFactor.toFixed(2) : '∞'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Cumulative PnL Equity Curve Graph */}
      {equityPoints.length > 1 && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
                Cumulative Equity Curve
              </h3>
              <p className="text-xs text-zinc-500">PnL progression over backtested trades</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-500 font-mono">Current: </span>
              <span
                className={`text-sm font-mono font-bold ${
                  overall.pnlSum >= 0 ? 'text-emerald-400' : 'text-rose-400'
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

  const isNetPositive = points[points.length - 1].cumPnL >= 0

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44 text-zinc-800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="equityGradPositive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="equityGradNegative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Zero baseline */}
        <line
          x1={paddingX}
          y1={zeroY}
          x2={width - paddingX}
          y2={zeroY}
          stroke="#3f3f46"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Filled Area */}
        <path
          d={areaD}
          fill={isNetPositive ? 'url(#equityGradPositive)' : 'url(#equityGradNegative)'}
        />

        {/* Curve Line */}
        <path
          d={pathD}
          fill="none"
          stroke={isNetPositive ? '#10b981' : '#f43f5e'}
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
            r="3"
            className={
              isNetPositive
                ? 'fill-emerald-400 stroke-zinc-900 stroke-2'
                : 'fill-rose-400 stroke-zinc-900 stroke-2'
            }
          />
        ))}
      </svg>
    </div>
  )
}

function PerformanceTable({ title, items, type }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-800/60 text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
            <tr>
              <th className="pb-3 pr-4">{type === 'strategy' ? 'Strategy' : 'Pair'}</th>
              <th className="pb-3 px-3 text-center">Trades</th>
              <th className="pb-3 px-3">Win Rate</th>
              <th className="pb-3 px-3 text-right">Avg R</th>
              <th className="pb-3 pl-3 text-right">PnL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40 font-mono text-xs">
            {items.map((row) => (
              <tr key={row.label} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-3 pr-4 font-sans font-medium text-zinc-200">
                  <span className="truncate max-w-[150px] inline-block">{row.label}</span>
                </td>
                <td className="py-3 px-3 text-center text-zinc-400 font-mono">
                  {row.total}{' '}
                  <span className="text-[10px] text-zinc-500">
                    ({row.wins}W/{row.losses}L)
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-zinc-200">{row.winRate.toFixed(0)}%</span>
                    <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
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
                        ? 'text-emerald-400 font-semibold'
                        : row.avgR < 0
                        ? 'text-rose-400 font-semibold'
                        : 'text-zinc-400'
                    }
                  >
                    {row.avgR > 0 ? `+${row.avgR.toFixed(2)}` : row.avgR.toFixed(2)}R
                  </span>
                </td>
                <td className="py-3 pl-3 text-right">
                  <span
                    className={`font-semibold ${
                      row.pnlSum > 0
                        ? 'text-emerald-400'
                        : row.pnlSum < 0
                        ? 'text-rose-400'
                        : 'text-zinc-400'
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
