/**
 * Laning Efficiency Component
 *
 * Displays laning phase metrics (CS@10, Denies@10, Lane outcome)
 */

import type { LaningEfficiencyAnalysisData } from '@/lib/dota/analysis/computeLaning'
import { formatNumberOrNA, formatPercentageOrNA } from '@/utils/dotaFormatting'

interface LaningEfficiencyProps {
  data: LaningEfficiencyAnalysisData
}

export function LaningEfficiency({
  data,
}: LaningEfficiencyProps): React.JSX.Element {
  if (data.status === 'unavailable') {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">
          Laning Efficiency
        </h2>
        <div className="text-sm text-neutral-500">
          Dati laning non disponibili per questa partita.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Laning Efficiency (0-10 min)
      </h2>
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.csAt10 !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">CS @10</div>
            <div className="text-xl font-bold text-neutral-100">
              {data.csAt10}
            </div>
          </div>
        )}
        {data.deniesAt10 !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">Denies @10</div>
            <div className="text-xl font-bold text-neutral-100">
              {data.deniesAt10}
            </div>
          </div>
        )}
        {data.xpAt10 !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">XP @10</div>
            <div className="text-xl font-bold text-neutral-100">
              {formatNumberOrNA(data.xpAt10)}
            </div>
          </div>
        )}
        {data.laneOutcome && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">Lane Outcome</div>
            <div
              className={`text-xl font-bold ${
                data.laneOutcome === 'Win'
                  ? 'text-green-400'
                  : data.laneOutcome === 'Lose'
                    ? 'text-red-400'
                    : 'text-yellow-400'
              }`}
            >
              {data.laneOutcome}
            </div>
          </div>
        )}
        {data.efficiency !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">Efficienza %</div>
            <div className="text-xl font-bold text-neutral-100">
              {formatPercentageOrNA(data.efficiency, 1)}
            </div>
          </div>
        )}
      </div>
      {data.insights.length > 0 && (
        <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="text-xs font-semibold text-neutral-300">Insights</div>
          {data.insights.map((insight: string, idx: number) => (
            <div key={idx} className="text-sm text-neutral-400">
              • {insight}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
