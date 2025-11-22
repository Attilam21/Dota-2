/**
 * Item Progression Component
 *
 * Displays item timing metrics
 */

import type { ItemProgressionAnalysisData } from '@/lib/dota/analysis/computeItemProgression'
import { formatNumberOrNA } from '@/utils/dotaFormatting'

interface ItemProgressionProps {
  data: ItemProgressionAnalysisData
}

export function ItemProgression({
  data,
}: ItemProgressionProps): React.JSX.Element {
  if (data.status === 'unavailable') {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">
          Item Progression
        </h2>
        <div className="text-sm text-neutral-500">
          Dati progressione item non disponibili. Richiedono timeline acquisti
          item che non sono ancora disponibili da OpenDota.
        </div>
        {data.insights.length > 0 && (
          <div className="mt-4 space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs font-semibold text-neutral-300">Note</div>
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

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Item Progression
      </h2>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.timeToFirstItem !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">
              Time to First Item
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatNumberOrNA(data.timeToFirstItem)} min
            </div>
          </div>
        )}
        {data.timeToMidItem !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">
              Time to Mid Item
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatNumberOrNA(data.timeToMidItem)} min
            </div>
          </div>
        )}
        {data.timeToLateItem !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">
              Time to Late Item
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatNumberOrNA(data.timeToLateItem)} min
            </div>
          </div>
        )}
      </div>
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
