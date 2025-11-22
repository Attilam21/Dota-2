/**
 * Kill Distribution Block Component
 *
 * Displays kill distribution by game phase with bar chart and insight
 */

import type { KillDistribution } from '@/types/matchAnalysis'
import BarChart from '@/components/charts/BarChart'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'

interface KillDistributionBlockProps {
  data: KillDistribution
}

export function KillDistributionBlock({
  data,
}: KillDistributionBlockProps): React.JSX.Element {
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

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Kill Distribution per Fase
      </h2>

      {/* Bar Chart */}
      <div className="mb-4 h-[200px] w-full">
        <BarChart data={chartData} width={800} height={200} showValues={true} />
      </div>

      {/* Phase Cards */}
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

      {/* Insight */}
      {data.insight && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="mb-1 text-xs font-semibold text-neutral-300">
            Insight Kill Distribution
          </div>
          <div className="text-sm text-neutral-400">{data.insight}</div>
        </div>
      )}
    </div>
  )
}
