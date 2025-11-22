/**
 * Coaching Impact Component
 *
 * Displays coaching impact metrics and summary
 */

import type { CoachingImpact } from '@/lib/dota/coaching/types'
import { formatPercentageOrNA, formatValueOrNA } from '@/utils/dotaFormatting'

interface CoachingImpactProps {
  impact: CoachingImpact
}

export function CoachingImpact({
  impact,
}: CoachingImpactProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Impatto del Coaching
      </h2>
      <p className="mb-6 text-sm text-neutral-400">{impact.periodLabel}</p>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-400">Task completati</div>
          <div className="text-2xl font-bold text-neutral-100">
            {impact.tasksCompleted}
          </div>
        </div>
        {impact.avgFzthScoreBefore !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">FZTH Score (prima)</div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatValueOrNA(impact.avgFzthScoreBefore, 0)}
            </div>
          </div>
        )}
        {impact.avgFzthScoreAfter !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">FZTH Score (dopo)</div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatValueOrNA(impact.avgFzthScoreAfter, 0)}
            </div>
          </div>
        )}
        {impact.winrateBefore !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">Winrate (prima)</div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatPercentageOrNA(impact.winrateBefore, 1)}%
            </div>
          </div>
        )}
        {impact.winrateAfter !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">Winrate (dopo)</div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatPercentageOrNA(impact.winrateAfter, 1)}%
            </div>
          </div>
        )}
      </div>

      {/* Summary Text */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="text-sm font-semibold text-neutral-300">Riepilogo</div>
        <div className="mt-2 text-sm text-neutral-400">
          {impact.summaryText}
        </div>
      </div>
    </div>
  )
}
