/**
 * Teamfights Component
 *
 * Displays teamfight participation and outcomes
 */

import type { TeamfightsAnalysisData } from '@/lib/dota/analysis/computeTeamfights'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'

interface TeamfightsProps {
  data: TeamfightsAnalysisData
}

export function Teamfights({ data }: TeamfightsProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Teamfights Analysis
      </h2>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.fightParticipation !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">
              Fight Participation
            </div>
            <div
              className={`text-2xl font-bold ${
                data.fightParticipation >= 70
                  ? 'text-green-400'
                  : data.fightParticipation >= 40
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {formatPercentageOrNA(data.fightParticipation, 1)}
            </div>
          </div>
        )}
        {data.fightOutcomeWhenPresent && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-400">
              Outcome When Present
            </div>
            <div
              className={`text-2xl font-bold ${
                data.fightOutcomeWhenPresent === 'Positive'
                  ? 'text-green-400'
                  : data.fightOutcomeWhenPresent === 'Negative'
                    ? 'text-red-400'
                    : 'text-yellow-400'
              }`}
            >
              {data.fightOutcomeWhenPresent}
            </div>
          </div>
        )}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="mb-2 text-xs text-neutral-400">Death Clustering</div>
          <div
            className={`text-2xl font-bold ${
              data.deathClustering >= 3
                ? 'text-red-400'
                : data.deathClustering >= 2
                  ? 'text-yellow-400'
                  : 'text-green-400'
            }`}
          >
            {data.deathClustering}
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
