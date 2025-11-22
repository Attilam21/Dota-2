/**
 * Combat Analysis Component
 *
 * Displays combat metrics and fight impact
 */

import type { CombatAnalysisData } from '@/lib/dota/analysis/computeCombat'
import { formatNumberOrNA, formatPercentageOrNA } from '@/utils/dotaFormatting'

interface CombatAnalysisProps {
  data: CombatAnalysisData
}

export function CombatAnalysis({
  data,
}: CombatAnalysisProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Combat Analysis
      </h2>
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.heroDamage !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">Hero Damage</div>
            <div className="text-xl font-bold text-neutral-100">
              {formatNumberOrNA(data.heroDamage)}
            </div>
            {data.heroDamagePercent !== null && (
              <div className="text-xs text-neutral-500">
                {formatPercentageOrNA(data.heroDamagePercent, 1)} vs team avg
              </div>
            )}
          </div>
        )}
        {data.fightImpactScore !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">Fight Impact Score</div>
            <div
              className={`text-xl font-bold ${
                data.fightImpactScore >= 70
                  ? 'text-green-400'
                  : data.fightImpactScore >= 40
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {data.fightImpactScore}/100
            </div>
          </div>
        )}
        {data.damageTaken !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">Damage Taken</div>
            <div className="text-xl font-bold text-neutral-100">
              {formatNumberOrNA(data.damageTaken)}
            </div>
          </div>
        )}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-400">Death Clusters</div>
          <div className="text-xl font-bold text-neutral-100">
            {data.deathClusters}
          </div>
        </div>
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
