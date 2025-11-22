/**
 * Teammate Top Table Component
 *
 * Displays top teammates with best winrate
 */

import type { TeammateAggregated } from '@/types/teammates'
import { getTeammateDisplayName } from '@/lib/dota/teammates'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'
import { MIN_MATCHES_FOR_TEAMMATE } from '@/lib/dota/teammates'

interface TeammateTopTableProps {
  teammates: TeammateAggregated[]
}

export default function TeammateTopTable({
  teammates,
}: TeammateTopTableProps): React.JSX.Element {
  // Filter by minimum matches and sort by winrate descending
  const topTeammates = teammates
    .filter((t) => t.matches >= MIN_MATCHES_FOR_TEAMMATE)
    .sort((a, b) => b.winrate - a.winrate)
    .slice(0, 5)

  if (topTeammates.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">
          Top compagni con cui vinci di più
        </h2>
        <div className="text-sm text-neutral-500">
          Nessun compagno con almeno {MIN_MATCHES_FOR_TEAMMATE} partite insieme.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h2 className="mb-3 text-lg font-semibold text-neutral-200">
        Top compagni con cui vinci di più
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900/60 text-neutral-300">
            <tr>
              <th className="h-9 px-2 text-left font-medium">Compagno</th>
              <th className="h-9 w-[80px] px-2 text-left font-medium">
                Partite
              </th>
              <th className="h-9 w-[100px] px-2 text-left font-medium">
                Winrate
              </th>
              <th className="h-9 w-[100px] px-2 text-left font-medium">
                V / S
              </th>
            </tr>
          </thead>
          <tbody>
            {topTeammates.map((teammate) => {
              const displayName = getTeammateDisplayName(teammate)
              const winrateColor =
                teammate.winrate >= 60
                  ? 'text-green-400'
                  : teammate.winrate < 45
                    ? 'text-red-400'
                    : 'text-neutral-300'

              return (
                <tr
                  key={teammate.accountId}
                  className="h-9 border-t border-neutral-800 hover:bg-neutral-900/40"
                >
                  <td className="px-2 py-0.5">
                    <span className="font-mono text-xs">{displayName}</span>
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
      <div className="mt-3 text-xs text-neutral-500">
        Mostrati solo i compagni con almeno {MIN_MATCHES_FOR_TEAMMATE} partite
        giocate insieme (configurabile via costante).
      </div>
      {/* TODO: Future - Vedi elenco completo button/modal/CSV export */}
      {/* <div className="mt-2">
        <button
          className="text-xs text-blue-400 hover:underline"
          disabled
          title="Funzionalità in sviluppo"
        >
          Vedi elenco completo
        </button>
      </div> */}
    </div>
  )
}
