/**
 * Companions Table Component
 *
 * Displays top 15 teammates with compact table
 */

import type { TeammateAggregated } from '@/types/teammates'
import { getTeammateDisplayName } from '@/lib/dota/teammates'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'
import { MIN_MATCHES_FOR_TEAMMATE } from '@/lib/dota/teammates'
import { cn } from '@/utils/tailwind'

interface CompanionsTableProps {
  teammates: TeammateAggregated[]
  onTeammateClick?: (teammate: TeammateAggregated) => void
}

const TOP_COMPANIONS_LIMIT = 15

export default function CompanionsTable({
  teammates,
  onTeammateClick,
}: CompanionsTableProps): React.JSX.Element {
  // Filter by minimum matches and sort by matches descending
  const filtered = teammates
    .filter((t) => t.matches >= MIN_MATCHES_FOR_TEAMMATE)
    .sort((a, b) => b.matches - a.matches)
    .slice(0, TOP_COMPANIONS_LIMIT)

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">
          Top Compagni
        </h2>
        <div className="text-sm text-neutral-500">
          Nessun compagno con almeno {MIN_MATCHES_FOR_TEAMMATE} partite insieme.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
      <div className="border-b border-neutral-800 px-4 py-3">
        <h2 className="text-lg font-semibold text-neutral-200">
          Top {TOP_COMPANIONS_LIMIT} Compagni
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          Tabella dei compagni più giocati insieme (minimo{' '}
          {MIN_MATCHES_FOR_TEAMMATE} partite).
        </p>
      </div>
      <div className="max-h-[600px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-900/95 text-neutral-300 backdrop-blur-sm">
            <tr>
              <th className="h-9 px-2 text-left font-medium">Compagno</th>
              <th className="h-9 w-[80px] px-2 text-left font-medium">
                Partite
              </th>
              <th className="h-9 w-[100px] px-2 text-left font-medium">WR%</th>
              <th className="h-9 w-[120px] px-2 text-left font-medium">
                Vittorie/Sconfitte
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((teammate) => {
              const displayName = getTeammateDisplayName(teammate)
              const winrateColor =
                teammate.winrate >= 60
                  ? 'text-green-400'
                  : teammate.winrate >= 45
                    ? 'text-neutral-300'
                    : 'text-red-400'

              return (
                <tr
                  key={teammate.accountId}
                  className={cn(
                    'h-9 cursor-pointer border-l-2 border-t border-neutral-800 border-transparent transition-colors hover:bg-neutral-900/40',
                    onTeammateClick && 'hover:bg-neutral-900/60',
                  )}
                  onClick={() => onTeammateClick?.(teammate)}
                >
                  <td className="px-2 py-0.5">
                    <span
                      className="max-w-[140px] truncate font-mono text-xs"
                      title={displayName}
                    >
                      {displayName}
                    </span>
                  </td>
                  <td className="px-2 py-0.5 text-right text-[13px]">
                    {teammate.matches}
                  </td>
                  <td className="px-2 py-0.5 text-right text-[13px]">
                    <span className={winrateColor}>
                      {formatPercentageOrNA(teammate.winrate, 1)}
                    </span>
                  </td>
                  <td className="px-2 py-0.5 text-right text-[13px]">
                    {teammate.wins} / {teammate.losses}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
