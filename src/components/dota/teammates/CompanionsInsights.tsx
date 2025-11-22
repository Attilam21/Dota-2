/**
 * Companions Insights Component
 *
 * Displays textual insights based on teammate performance
 */

import type { TeammateAggregated } from '@/types/teammates'
import { getTeammateDisplayName } from '@/lib/dota/teammates'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'
import { MIN_MATCHES_FOR_TEAMMATE } from '@/lib/dota/teammates'

interface CompanionsInsightsProps {
  teammates: TeammateAggregated[]
}

export default function CompanionsInsights({
  teammates,
}: CompanionsInsightsProps): React.JSX.Element {
  // Filter by minimum matches
  const eligible = teammates.filter(
    (t) => t.matches >= MIN_MATCHES_FOR_TEAMMATE,
  )

  if (eligible.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h3 className="mb-2 text-sm font-semibold text-neutral-200">
          Insight sinergie
        </h3>
        <div className="text-sm text-neutral-500">
          Dati insufficienti per generare insight. Gioca più partite in party
          con almeno {MIN_MATCHES_FOR_TEAMMATE} partite insieme per vedere le
          sinergie.
        </div>
      </div>
    )
  }

  // Find best and worst teammates
  const bestTeammate =
    eligible.length > 0
      ? eligible.reduce((best, current) =>
          current.winrate > best.winrate ? current : best,
        )
      : null

  const worstTeammate =
    eligible.length > 0
      ? eligible.reduce((worst, current) =>
          current.winrate < worst.winrate ? current : worst,
        )
      : null

  const insights: string[] = []

  if (bestTeammate) {
    const displayName = getTeammateDisplayName(bestTeammate)
    insights.push(
      `Miglior sinergia: ${displayName} con ${formatPercentageOrNA(
        bestTeammate.winrate,
        1,
      )} su ${bestTeammate.matches} partite.`,
    )
  }

  if (worstTeammate && worstTeammate.winrate < 50) {
    const displayName = getTeammateDisplayName(worstTeammate)
    insights.push(
      `Sinergia critica: ${displayName} con solo ${formatPercentageOrNA(
        worstTeammate.winrate,
        1,
      )} su ${
        worstTeammate.matches
      } partite, valuta se giocare meno insieme in ranked.`,
    )
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h3 className="mb-2 text-sm font-semibold text-neutral-200">
          Insight sinergie
        </h3>
        <div className="text-sm text-neutral-500">
          Non ci sono abbastanza dati per generare insight significativi.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h3 className="mb-3 text-sm font-semibold text-neutral-200">
        Insight sinergie
      </h3>
      <ul className="space-y-2 text-sm text-neutral-300">
        {insights.map((insight, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="mt-1 text-blue-400">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
