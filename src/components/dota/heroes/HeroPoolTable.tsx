/**
 * Hero Pool Table Component
 *
 * Displays sortable table with hero performance stats
 * Enterprise-grade compact table with sticky header and row selection
 */

import Link from 'next/link'
import type { HeroPerformanceRow } from '@/types/heroPool'
import { getHeroIconUrl } from '@/lib/dotaHeroes'
import {
  formatPercentageOrNA,
  formatValueOrNA,
  isValueMissing,
} from '@/utils/dotaFormatting'
import { cn } from '@/utils/tailwind'

interface HeroPoolTableProps {
  heroes: HeroPerformanceRow[]
  playerId: number | null
  sortBy: 'matches' | 'winrate'
  sortDir: 'asc' | 'desc'
  onSort: (key: 'matches' | 'winrate') => void
  onHeroSelect?: (hero: HeroPerformanceRow) => void
  selectedHero?: HeroPerformanceRow | null
}

export default function HeroPoolTable({
  heroes,
  playerId,
  sortBy,
  sortDir,
  onSort,
  onHeroSelect,
  selectedHero,
}: HeroPoolTableProps): React.JSX.Element {
  const sorted = [...heroes].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortBy === 'matches') return mul * (a.matches - b.matches)
    return mul * (a.winrate - b.winrate)
  })

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
      <div className="border-b border-neutral-800 px-4 py-3">
        <h2 className="text-lg font-semibold text-neutral-200">
          Performance per eroe
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          Clicca su un eroe nella tabella per vedere i dettagli e il
          posizionamento nel grafico Winrate vs Utilizzo.
        </p>
      </div>
      <div className="max-h-[600px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-900/95 text-neutral-300 backdrop-blur-sm">
            <tr>
              <th className="h-9 px-2 text-left font-medium">Eroe</th>
              <th
                className="h-9 w-[80px] cursor-pointer px-2 text-left font-medium hover:text-neutral-100"
                onClick={() => onSort('matches')}
                title="Ordina per partite"
              >
                Partite{' '}
                {sortBy === 'matches' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th
                className="h-9 w-[100px] cursor-pointer px-2 text-left font-medium hover:text-neutral-100"
                onClick={() => onSort('winrate')}
                title="Ordina per winrate"
              >
                Winrate{' '}
                {sortBy === 'winrate' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th className="h-9 w-[80px] px-2 text-left font-medium">
                KDA medio
              </th>
              <th className="h-9 w-[80px] px-2 text-left font-medium">
                GPM medio
              </th>
              <th className="h-9 w-[80px] px-2 text-left font-medium">
                XPM medio
              </th>
              <th className="h-9 w-[110px] px-2 text-left font-medium">
                Durata media
              </th>
              <th className="h-9 w-[120px] px-2 text-left font-medium">
                Ruolo/Lane
              </th>
              <th className="h-9 w-[110px] px-2 text-left font-medium">
                Dettagli
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((hero) => {
              const icon = getHeroIconUrl(hero.heroId)
              const isSelected = selectedHero?.heroId === hero.heroId
              const winrateColor =
                hero.winrate >= 60
                  ? 'text-green-400'
                  : hero.winrate < 45
                    ? 'text-red-400'
                    : 'text-neutral-300'

              return (
                <tr
                  key={hero.heroId}
                  className={cn(
                    'h-9 cursor-pointer border-l-2 border-t border-neutral-800 border-transparent transition-colors hover:bg-neutral-900/40',
                    isSelected &&
                      'border-l-2 border-blue-500 bg-neutral-900/60',
                  )}
                  onClick={() => onHeroSelect?.(hero)}
                >
                  <td className="px-2 py-0.5">
                    <div className="flex items-center gap-2">
                      {icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={icon}
                          alt={hero.heroName}
                          width={16}
                          height={16}
                          className="h-4 w-4 flex-shrink-0 rounded"
                          loading="lazy"
                          onError={(e) => {
                            ;(
                              e.currentTarget as HTMLImageElement
                            ).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-neutral-700 text-[9px]">
                          {hero.heroName.charAt(0)}
                        </div>
                      )}
                      <span
                        className="max-w-[140px] truncate"
                        title={hero.heroName}
                      >
                        {hero.heroName}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-0.5 text-right text-[13px]">
                    {hero.matches}
                  </td>
                  <td className="px-2 py-0.5 text-right text-[13px]">
                    <span className={winrateColor}>
                      {formatPercentageOrNA(hero.winrate, 1)}
                    </span>
                  </td>
                  <td className="px-2 py-0.5 text-right text-[13px]">
                    {isValueMissing(hero.kda)
                      ? '—'
                      : formatValueOrNA(hero.kda, 2)}
                  </td>
                  <td className="px-2 py-0.5 text-right text-[13px]">
                    {isValueMissing(hero.gpm) ? '—' : hero.gpm}
                  </td>
                  <td className="px-2 py-0.5 text-right text-[13px]">
                    {isValueMissing(hero.xpm) ? '—' : hero.xpm}
                  </td>
                  <td className="px-2 py-0.5 text-right text-[13px]">
                    {isValueMissing(hero.avgDurationMinutes)
                      ? '—'
                      : `${hero.avgDurationMinutes} min`}
                  </td>
                  <td className="px-2 py-0.5">
                    <span className="text-xs text-neutral-400">
                      {hero.primaryRole || '—'} / {hero.primaryLane || '—'}
                    </span>
                  </td>
                  <td className="px-2 py-0.5">
                    {playerId ? (
                      <Link
                        href={`/dashboard/matches?playerId=${playerId}&heroId=${hero.heroId}`}
                        className="text-xs text-blue-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Vedi partite
                      </Link>
                    ) : (
                      <span className="text-xs text-neutral-500">—</span>
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
