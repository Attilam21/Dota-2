/**
 * Hero Pool Table Component
 *
 * Displays sortable table with hero performance stats
 */

import Link from 'next/link'
import type { HeroPerformanceRow } from '@/types/heroPool'
import { getHeroIconUrl } from '@/lib/dotaHeroes'
import {
  formatPercentageOrNA,
  formatValueOrNA,
  isValueMissing,
} from '@/utils/dotaFormatting'

interface HeroPoolTableProps {
  heroes: HeroPerformanceRow[]
  playerId: number | null
  sortBy: 'matches' | 'winrate'
  sortDir: 'asc' | 'desc'
  onSort: (key: 'matches' | 'winrate') => void
  onHeroSelect?: (hero: HeroPerformanceRow) => void
}

export default function HeroPoolTable({
  heroes,
  playerId,
  sortBy,
  sortDir,
  onSort,
  onHeroSelect,
}: HeroPoolTableProps): React.JSX.Element {
  const sorted = [...heroes].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortBy === 'matches') return mul * (a.matches - b.matches)
    return mul * (a.winrate - b.winrate)
  })

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h2 className="mb-3 text-lg font-semibold text-neutral-200">
        Performance per eroe
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900/60 text-neutral-300">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Eroe</th>
              <th
                className="cursor-pointer px-3 py-2 text-left font-medium hover:text-neutral-100"
                onClick={() => onSort('matches')}
                title="Ordina per partite"
              >
                Partite{' '}
                {sortBy === 'matches' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-left font-medium hover:text-neutral-100"
                onClick={() => onSort('winrate')}
                title="Ordina per winrate"
              >
                Winrate{' '}
                {sortBy === 'winrate' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th className="px-3 py-2 text-left font-medium">KDA medio</th>
              <th className="px-3 py-2 text-left font-medium">GPM medio</th>
              <th className="px-3 py-2 text-left font-medium">XPM medio</th>
              <th className="px-3 py-2 text-left font-medium">
                Durata media (min)
              </th>
              <th className="px-3 py-2 text-left font-medium">Ruolo/Lane</th>
              <th className="px-3 py-2 text-left font-medium">Dettagli</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((hero) => {
              const icon = getHeroIconUrl(hero.heroId)
              const winrateColor =
                hero.winrate >= 60
                  ? 'text-green-400'
                  : hero.winrate < 45
                    ? 'text-red-400'
                    : 'text-neutral-300'

              return (
                <tr
                  key={hero.heroId}
                  className="cursor-pointer border-t border-neutral-800 hover:bg-neutral-900/40"
                  onClick={() => onHeroSelect?.(hero)}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={icon}
                          alt={hero.heroName}
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded"
                          loading="lazy"
                          onError={(e) => {
                            ;(
                              e.currentTarget as HTMLImageElement
                            ).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-neutral-700 text-[10px]">
                          {hero.heroName.charAt(0)}
                        </div>
                      )}
                      <span>{hero.heroName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">{hero.matches}</td>
                  <td className="px-3 py-2">
                    <span className={winrateColor}>
                      {formatPercentageOrNA(hero.winrate, 1)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {isValueMissing(hero.kda)
                      ? '—'
                      : formatValueOrNA(hero.kda, 2)}
                  </td>
                  <td className="px-3 py-2">
                    {isValueMissing(hero.gpm) ? '—' : hero.gpm}
                  </td>
                  <td className="px-3 py-2">
                    {isValueMissing(hero.xpm) ? '—' : hero.xpm}
                  </td>
                  <td className="px-3 py-2">
                    {isValueMissing(hero.avgDurationMinutes)
                      ? '—'
                      : `${hero.avgDurationMinutes} min`}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-neutral-400">
                      {hero.primaryRole || '—'} / {hero.primaryLane || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {playerId ? (
                      <Link
                        href={`/dashboard/matches?playerId=${playerId}&heroId=${hero.heroId}`}
                        className="text-blue-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Vedi partite
                      </Link>
                    ) : (
                      '—'
                    )}
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
