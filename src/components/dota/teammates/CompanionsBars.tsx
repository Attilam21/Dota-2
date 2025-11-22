/**
 * Companions Bars Chart Component
 *
 * Horizontal bar chart showing Top 15 teammates by matches
 * Winrate color coding: green (≥60%), yellow (45-60%), red (<45%)
 */

import type { TeammateAggregated } from '@/types/teammates'
import { getTeammateDisplayName } from '@/lib/dota/teammates'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'
import { MIN_MATCHES_FOR_TEAMMATE } from '@/lib/dota/teammates'

interface CompanionsBarsProps {
  teammates: TeammateAggregated[]
}

const TOP_COMPANIONS_LIMIT = 15

export default function CompanionsBars({
  teammates,
}: CompanionsBarsProps): React.JSX.Element {
  // Filter by minimum matches and sort by matches descending
  const filtered = teammates
    .filter((t) => t.matches >= MIN_MATCHES_FOR_TEAMMATE)
    .sort((a, b) => b.matches - a.matches)
    .slice(0, TOP_COMPANIONS_LIMIT)

  if (!filtered || filtered.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">
          Top Compagni
        </h2>
        <div className="flex h-[300px] items-center justify-center text-sm text-neutral-500">
          Dati insufficienti per questa analisi. Gioca più partite in party per
          abilitare le sinergie.
        </div>
      </div>
    )
  }

  const maxMatches = Math.max(...filtered.map((t) => t.matches))
  const chartWidth = 700
  const chartHeight = Math.max(400, filtered.length * 25 + 80) // Dynamic height based on number of bars
  const barHeight = 20
  const barSpacing = 8
  const leftPadding = 140 // Space for teammate name/ID
  const rightPadding = 80 // Space for winrate label
  const chartAreaWidth = chartWidth - leftPadding - rightPadding

  // Scale function for matches to chart width
  const scaleX = (matches: number) => {
    if (maxMatches === 0) return 0
    return (matches / maxMatches) * chartAreaWidth
  }

  // Get color based on winrate
  const getWinrateColor = (winrate: number): string => {
    if (winrate >= 60) return '#7AE582' // green
    if (winrate >= 45) return '#FFD966' // yellow
    return '#FF6B6B' // red
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h2 className="mb-3 text-lg font-semibold text-neutral-200">
        Top {TOP_COMPANIONS_LIMIT} Compagni
      </h2>
      <div className="overflow-x-auto">
        <svg
          width="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="max-w-full"
        >
          {/* Grid lines for matches */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const x = leftPadding + (chartAreaWidth * pct) / 100
            return (
              <g key={`grid-${pct}`}>
                <line
                  x1={x}
                  y1={40}
                  x2={x}
                  y2={chartHeight - 20}
                  stroke="#374151"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={35}
                  fontSize="10"
                  fill="#9ca3af"
                  textAnchor="middle"
                >
                  {Math.round((maxMatches * pct) / 100)}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {filtered.map((teammate, idx) => {
            const y = 50 + idx * (barHeight + barSpacing)
            const barWidth = scaleX(teammate.matches)
            const displayName = getTeammateDisplayName(teammate)
            const color = getWinrateColor(teammate.winrate)

            // Truncate display name if too long
            const truncatedName =
              displayName.length > 15
                ? displayName.substring(0, 15) + '...'
                : displayName

            return (
              <g key={teammate.accountId}>
                {/* Teammate name/ID on left */}
                <text
                  x={leftPadding - 10}
                  y={y + barHeight / 2 + 4}
                  fontSize="11"
                  fill="#e5e7eb"
                  textAnchor="end"
                  className="font-mono"
                >
                  {truncatedName}
                </text>

                {/* Bar */}
                <rect
                  x={leftPadding}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx={2}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                />

                {/* Matches value inside bar (if bar is wide enough) */}
                {barWidth > 50 && (
                  <text
                    x={leftPadding + barWidth / 2}
                    y={y + barHeight / 2 + 4}
                    fontSize="10"
                    fill="#1f2937"
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {teammate.matches}
                  </text>
                )}

                {/* Winrate label on right */}
                <text
                  x={leftPadding + chartAreaWidth + 10}
                  y={y + barHeight / 2 + 4}
                  fontSize="11"
                  fill={
                    teammate.winrate >= 60
                      ? '#7AE582'
                      : teammate.winrate >= 45
                        ? '#FFD966'
                        : '#FF6B6B'
                  }
                  textAnchor="start"
                  fontWeight="500"
                >
                  {formatPercentageOrNA(teammate.winrate, 1)}
                </text>

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

          {/* X-axis label */}
          <text
            x={leftPadding + chartAreaWidth / 2}
            y={chartHeight - 5}
            fontSize="11"
            fill="#9ca3af"
            textAnchor="middle"
          >
            Partite insieme
          </text>
        </svg>
      </div>
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-500" />
          <span>Winrate ≥ 60%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-yellow-500" />
          <span>45% ≤ Winrate &lt; 60%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-red-500" />
          <span>Winrate &lt; 45%</span>
        </div>
      </div>
    </div>
  )
}
