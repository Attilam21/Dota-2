/**
 * Objectives Component
 *
 * Displays objective participation metrics
 */

import type { ObjectivesAnalysisData } from '@/lib/dota/analysis/computeObjectives'
import { formatNumberOrNA, formatPercentageOrNA } from '@/utils/dotaFormatting'

interface ObjectivesProps {
  data: ObjectivesAnalysisData
}

export function Objectives({ data }: ObjectivesProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Objective Contribution
      </h2>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.objectiveImpactScore !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">
              Objective Impact Score
            </div>
            <div
              className={`text-2xl font-bold ${
                data.objectiveImpactScore >= 70
                  ? 'text-green-400'
                  : data.objectiveImpactScore >= 40
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {data.objectiveImpactScore}/100
            </div>
          </div>
        )}
        {data.towerDamage !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">Tower Damage</div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatNumberOrNA(data.towerDamage)}
            </div>
            {data.towerDamagePercent !== null && (
              <div className="mt-1 text-xs text-neutral-500">
                {formatPercentageOrNA(data.towerDamagePercent, 1)} vs team avg
              </div>
            )}
          </div>
        )}
        {data.roshanParticipation !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">
              Roshan Participation
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatPercentageOrNA(data.roshanParticipation, 1)}
            </div>
          </div>
        )}
        {data.runePickups !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">Rune Pickups</div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatNumberOrNA(data.runePickups)}
            </div>
          </div>
        )}
        {data.observerPlacement !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">
              Observer Placement
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatNumberOrNA(data.observerPlacement)}
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
