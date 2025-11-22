/**
 * Teammate Synergy Scatter Chart Component
 *
 * Scatter plot: Winrate vs Utilization (matches)
 * Shows each teammate as a point on the chart
 */

import type { TeammateAggregated } from '@/types/teammates'
import { getTeammateDisplayName } from '@/lib/dota/teammates'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'
import { MIN_MATCHES_FOR_TEAMMATE } from '@/lib/dota/teammates'

interface TeammateSynergyScatterProps {
  teammates: TeammateAggregated[]
}

export default function TeammateSynergyScatter({
  teammates,
}: TeammateSynergyScatterProps): React.JSX.Element {
  // Filter by minimum matches
  const filtered = teammates.filter(
    (t) => t.matches >= MIN_MATCHES_FOR_TEAMMATE,
  )

  // Need at least 2 teammates to show chart
  if (!filtered || filtered.length < 2) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">
          Winrate vs Utilizzo
        </h2>
        <div className="flex h-[300px] items-center justify-center text-sm text-neutral-500">
          Dati insufficienti per questa analisi. Gioca più partite in party per
          abilitare le sinergie.
        </div>
      </div>
    )
  }

  const maxMatches = Math.max(...filtered.map((t) => t.matches))
  const minMatches = Math.min(...filtered.map((t) => t.matches))
  const matchRange = maxMatches - minMatches || 1

  const maxWinrate = Math.max(...filtered.map((t) => t.winrate))
  const minWinrate = Math.min(...filtered.map((t) => t.winrate))
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
    if (winrate >= 60) return '#22c55e' // green
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
            Partite insieme (Utilizzo)
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
          {filtered.map((teammate) => {
            const x = scaleX(teammate.matches)
            const y = scaleY(teammate.winrate)
            const color = getWinrateColor(teammate.winrate)
            const displayName = getTeammateDisplayName(teammate)

            return (
              <g key={teammate.accountId}>
                <circle
                  cx={x}
                  cy={y}
                  r={6}
                  fill={color}
                  stroke="#1f2937"
                  strokeWidth={1}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                />
                {/* Tooltip on hover */}
                <title>
                  {displayName}
                  {'\n'}
                  Partite: {teammate.matches}
                  {'\n'}
                  Winrate: {formatPercentageOrNA(teammate.winrate, 1)}
                  {'\n'}
                  Vittorie/Sconfitte: {teammate.wins}/{teammate.losses}
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
          <span>Winrate ≥ 60%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span>45% ≤ Winrate &lt; 60%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>Winrate &lt; 45%</span>
        </div>
      </div>
    </div>
  )
}
