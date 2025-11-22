/**
 * Profile Progress Timeline Component
 *
 * Displays FZTH Score progression over time
 */

import type { ProgressPoint } from '@/lib/dota/profile/types'
import MultiLineChart from '@/components/charts/MultiLineChart'
import { formatPercentageOrNA, formatValueOrNA } from '@/utils/dotaFormatting'

interface ProfileProgressTimelineProps {
  data: ProgressPoint[]
}

export function ProfileProgressTimeline({
  data,
}: ProfileProgressTimelineProps): React.JSX.Element {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-200">
          Progressione nel Tempo
        </h2>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-center text-sm text-neutral-500">
          Dati insufficienti per mostrare la progressione. Gioca più partite per
          vedere il trend.
        </div>
      </div>
    )
  }

  // Prepare chart data
  const chartData = data.map((point) => ({
    x: point.periodLabel,
    label: point.periodLabel,
    fzthScore: point.fzthScore,
    winrate: point.winrate ?? undefined,
    kda: point.avgKda ?? undefined,
  }))

  // Find best and worst periods
  const bestPeriod = data.reduce((best, current) =>
    current.fzthScore > best.fzthScore ? current : best,
  )
  const worstPeriod = data.reduce((worst, current) =>
    current.fzthScore < worst.fzthScore ? current : worst,
  )

  // Calculate trend
  const firstScore = data[0]?.fzthScore ?? 50
  const lastScore = data[data.length - 1]?.fzthScore ?? 50
  const trend =
    lastScore > firstScore ? 'up' : lastScore < firstScore ? 'down' : 'flat'

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Progressione nel Tempo
      </h2>

      {/* Chart */}
      <div className="mb-6 h-[300px]">
        <MultiLineChart
          data={chartData}
          lines={[
            { key: 'fzthScore', label: 'FZTH Score', color: '#60a5fa' },
            ...(data.some((p) => p.winrate !== null)
              ? [{ key: 'winrate', label: 'Winrate %', color: '#22c55e' }]
              : []),
          ]}
        />
      </div>

      {/* Insights */}
      <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="text-xs font-semibold text-neutral-300">Insights</div>
        {bestPeriod && (
          <div className="text-sm text-neutral-400">
            • Miglior periodo: {bestPeriod.periodLabel} con FZTH Score{' '}
            {bestPeriod.fzthScore}/100
            {bestPeriod.winrate !== null &&
              ` (WR: ${formatPercentageOrNA(bestPeriod.winrate, 1)})`}
          </div>
        )}
        {worstPeriod && worstPeriod.periodLabel !== bestPeriod.periodLabel && (
          <div className="text-sm text-neutral-400">
            • Periodo di calo: {worstPeriod.periodLabel} con FZTH Score{' '}
            {worstPeriod.fzthScore}/100
          </div>
        )}
        <div className="text-sm text-neutral-400">
          • Trend attuale:{' '}
          {trend === 'up'
            ? 'In miglioramento'
            : trend === 'down'
              ? 'In calo'
              : 'Stabile'}
        </div>
      </div>
    </div>
  )
}
