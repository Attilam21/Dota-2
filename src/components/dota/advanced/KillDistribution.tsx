/**
 * Kill Distribution Component
 *
 * Displays kill distribution by game phase (Early/Mid/Late)
 */

import type { KillDistribution } from '@/types/matchAnalysis'
import BarChart from '@/components/charts/BarChart'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'

interface KillDistributionProps {
  data: KillDistribution
}

export function KillDistribution({
  data,
}: KillDistributionProps): React.JSX.Element {
  const chartData = [
    {
      label: 'Early',
      value: data.early,
      color: '#22c55e', // Green
    },
    {
      label: 'Mid',
      value: data.mid,
      color: '#f59e0b', // Orange
    },
    {
      label: 'Late',
      value: data.late,
      color: '#ef4444', // Red
    },
  ]

  const insights: string[] = []
  if (data.percentages.late >= 60 && data.percentages.early < 20) {
    insights.push(
      "Kill concentrate in Late Game: valuta di anticipare l'impatto nelle fasi Early/Mid.",
    )
  }
  if (data.percentages.early >= 60 && data.percentages.late < 20) {
    insights.push(
      'Kill concentrate in Early Game: buon early ma impatto limitato nel late. Lavora sulla transizione mid/late.',
    )
  }
  if (data.percentages.mid >= 50) {
    insights.push('Focus su Mid Game: ottima presenza nella fase centrale.')
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Kill Distribution per Fase
      </h2>
      <div className="mb-4 h-[200px]">
        <BarChart data={chartData} width={560} height={200} showValues={true} />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-3 text-center">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-green-300">
            Early (0-10min)
          </div>
          <div className="text-xl font-bold text-green-200">{data.early}</div>
          <div className="mt-1 text-xs text-green-400/80">
            {formatPercentageOrNA(data.percentages.early, 1)}
          </div>
        </div>
        <div className="rounded-lg border border-orange-800/50 bg-orange-900/20 p-3 text-center">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-orange-300">
            Mid (10-30min)
          </div>
          <div className="text-xl font-bold text-orange-200">{data.mid}</div>
          <div className="mt-1 text-xs text-orange-400/80">
            {formatPercentageOrNA(data.percentages.mid, 1)}
          </div>
        </div>
        <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-3 text-center">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-red-300">
            Late (30+min)
          </div>
          <div className="text-xl font-bold text-red-200">{data.late}</div>
          <div className="mt-1 text-xs text-red-400/80">
            {formatPercentageOrNA(data.percentages.late, 1)}
          </div>
        </div>
      </div>
      {insights.length > 0 && (
        <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="text-xs font-semibold text-neutral-300">Insights</div>
          {insights.map((insight, idx) => (
            <div key={idx} className="text-sm text-neutral-400">
              • {insight}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
