/**
 * Hero Pool Chart Component
 *
 * Scatter plot: Winrate vs Utilization (matches)
 * Shows each hero as a point on the chart
 */

import type { HeroPerformanceRow } from '@/types/heroPool'
import { getHeroIconUrl, getHeroName } from '@/lib/dotaHeroes'
import { formatPercentageOrNA, formatValueOrNA } from '@/utils/dotaFormatting'

interface HeroPoolChartProps {
  heroes: HeroPerformanceRow[]
  onHeroSelect?: (hero: HeroPerformanceRow) => void
}

export default function HeroPoolChart({
  heroes,
  onHeroSelect,
}: HeroPoolChartProps): React.JSX.Element {
  // Need at least 2 heroes to show chart
  if (!heroes || heroes.length < 2) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">
          Winrate vs Utilizzo
        </h2>
        <div className="flex h-[300px] items-center justify-center text-sm text-neutral-500">
          Grafico disponibile quando hai almeno 2 eroi nel tuo pool.
        </div>
      </div>
    )
  }

  const maxMatches = Math.max(...heroes.map((h) => h.matches))
  const minMatches = Math.min(...heroes.map((h) => h.matches))
  const matchRange = maxMatches - minMatches || 1

  const maxWinrate = Math.max(...heroes.map((h) => h.winrate))
  const minWinrate = Math.min(...heroes.map((h) => h.winrate))
  const winrateRange = maxWinrate - minWinrate || 1

  // Chart dimensions
  const width = 800
  const height = 400
  const padding = 60
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // Scale functions
  const scaleX = (matches: number) => {
    return padding + ((matches - minMatches) / matchRange) * chartWidth
  }

  const scaleY = (winrate: number) => {
    return (
      height - padding - ((winrate - minWinrate) / winrateRange) * chartHeight
    )
  }

  const getWinrateColor = (winrate: number): string => {
    if (winrate >= 55) return '#22c55e' // green
    if (winrate >= 45) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h2 className="mb-3 text-lg font-semibold text-neutral-200">
        Winrate vs Utilizzo
      </h2>
      <div className="overflow-x-auto">
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="max-w-full"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((wr) => {
            const y = scaleY(wr)
            return (
              <g key={`grid-${wr}`}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#374151"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fontSize="10"
                  fill="#9ca3af"
                  textAnchor="end"
                >
                  {wr}%
                </text>
              </g>
            )
          })}

          {/* X-axis labels (matches) */}
          {Array.from({ length: 5 }, (_, i) => {
            const matches = minMatches + (matchRange * i) / 4
            const x = scaleX(matches)
            return (
              <text
                key={`x-label-${i}`}
                x={x}
                y={height - padding + 20}
                fontSize="10"
                fill="#9ca3af"
                textAnchor="middle"
              >
                {Math.round(matches)}
              </text>
            )
          })}

          {/* Axes */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#6b7280"
            strokeWidth={2}
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#6b7280"
            strokeWidth={2}
          />

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 10}
            fontSize="12"
            fill="#9ca3af"
            textAnchor="middle"
          >
            Partite (Utilizzo)
          </text>
          <text
            x={15}
            y={height / 2}
            fontSize="12"
            fill="#9ca3af"
            textAnchor="middle"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            Winrate (%)
          </text>

          {/* Data points */}
          {heroes.map((hero) => {
            const x = scaleX(hero.matches)
            const y = scaleY(hero.winrate)
            const color = getWinrateColor(hero.winrate)

            return (
              <g key={hero.heroId}>
                <circle
                  cx={x}
                  cy={y}
                  r={6}
                  fill={color}
                  stroke="#1f2937"
                  strokeWidth={1}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => onHeroSelect?.(hero)}
                />
                {/* Tooltip on hover (simplified, can be enhanced with React state) */}
                <title>
                  {getHeroName(hero.heroId)}
                  {'\n'}
                  Partite: {hero.matches}
                  {'\n'}
                  Winrate: {formatPercentageOrNA(hero.winrate, 1)}
                  {'\n'}
                  KDA: {formatValueOrNA(hero.kda, 2)}
                </title>
              </g>
            )
          })}
        </svg>
      </div>
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Winrate ≥ 55%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span>45% ≤ Winrate &lt; 55%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>Winrate &lt; 45%</span>
        </div>
      </div>
    </div>
  )
}
