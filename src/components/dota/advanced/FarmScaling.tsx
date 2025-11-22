/**
 * Farm & Scaling Component
 *
 * Displays farm scaling metrics and recovery score
 */

import type { FarmScalingAnalysisData } from '@/lib/dota/analysis/computeFarmScaling'
import { formatNumberOrNA, formatPercentageOrNA } from '@/utils/dotaFormatting'

interface FarmScalingProps {
  data: FarmScalingAnalysisData
}

export function FarmScaling({ data }: FarmScalingProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Farm & Scaling
      </h2>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.recoveryIndex !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">Recovery Index</div>
            <div
              className={`text-2xl font-bold ${
                data.recoveryLabel === 'Alto'
                  ? 'text-green-400'
                  : data.recoveryLabel === 'Medio'
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {data.recoveryIndex}/100
            </div>
            <div className="text-xs text-neutral-500">
              {data.recoveryLabel || 'N/A'}
            </div>
          </div>
        )}
        {data.scalingMidLate && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">
              Scaling Mid/Late
            </div>
            <div
              className={`text-2xl font-bold ${
                data.scalingMidLate === 'Alto'
                  ? 'text-green-400'
                  : data.scalingMidLate === 'Medio'
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {data.scalingMidLate}
            </div>
          </div>
        )}
      </div>
      {data.farmSpikes && data.farmSpikes.length > 0 && (
        <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="text-xs font-semibold text-neutral-300">
            Farm Spikes
          </div>
          <div className="text-sm text-neutral-500">
            Timeline farm spikes non disponibile (richiede dati avanzati)
          </div>
        </div>
      )}
      {data.insights.length > 0 && (
        <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="text-xs font-semibold text-neutral-300">Insights</div>
          {data.insights.map((insight, idx) => (
            <div key={idx} className="text-sm text-neutral-400">
              • {insight}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
