/**
 * Hero Focus Card Component
 *
 * Displays detailed stats for a selected hero
 */

import type { HeroPerformanceRow } from '@/types/heroPool'
import { getHeroIconUrl } from '@/lib/dotaHeroes'
import {
  formatPercentageOrNA,
  formatValueOrNA,
  isValueMissing,
} from '@/utils/dotaFormatting'

interface HeroFocusCardProps {
  hero: HeroPerformanceRow | null
}

export default function HeroFocusCard({
  hero,
}: HeroFocusCardProps): React.JSX.Element {
  if (!hero) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">
          Hero Focus
        </h2>
        <div className="text-sm text-neutral-500">
          Seleziona un eroe dalla tabella per vedere il dettaglio.
        </div>
      </div>
    )
  }

  const icon = getHeroIconUrl(hero.heroId)
  const winrateColor =
    hero.winrate >= 60
      ? 'text-green-400'
      : hero.winrate < 45
        ? 'text-red-400'
        : 'text-neutral-300'

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={icon}
            alt={hero.heroName}
            width={48}
            height={48}
            className="h-12 w-12 rounded"
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-neutral-700 text-lg">
            {hero.heroName.charAt(0)}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-neutral-200">
            {hero.heroName}
          </h2>
          {hero.primaryRole || hero.primaryLane ? (
            <div className="text-xs text-neutral-400">
              {hero.primaryRole || '—'} / {hero.primaryLane || '—'}
            </div>
          ) : null}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="text-xs text-neutral-400">Partite</div>
          <div className="text-xl font-semibold text-white">{hero.matches}</div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="text-xs text-neutral-400">Winrate</div>
          <div className={`text-xl font-semibold ${winrateColor}`}>
            {formatPercentageOrNA(hero.winrate, 1)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="text-xs text-neutral-400">KDA medio</div>
          <div className="text-xl font-semibold text-white">
            {isValueMissing(hero.kda) ? '—' : formatValueOrNA(hero.kda, 2)}
          </div>
        </div>
        {!isValueMissing(hero.gpm) && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">GPM medio</div>
            <div className="text-xl font-semibold text-white">{hero.gpm}</div>
          </div>
        )}
        {!isValueMissing(hero.xpm) && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">XPM medio</div>
            <div className="text-xl font-semibold text-white">{hero.xpm}</div>
          </div>
        )}
        {!isValueMissing(hero.avgDurationMinutes) && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Durata media</div>
            <div className="text-xl font-semibold text-white">
              {hero.avgDurationMinutes} min
            </div>
          </div>
        )}
      </div>

      {/* Build tipica - Note: dati non disponibili per ora */}
      {/* <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
        <div className="mb-2 text-sm font-semibold text-neutral-200">
          Build tipica
        </div>
        <div className="text-xs text-neutral-400">
          Build basata solo sulle tue partite. Non rappresenta un meta globale.
        </div>
        <div className="mt-2 text-sm text-neutral-500">
          Dati build non disponibili per questo eroe.
        </div>
      </div> */}
    </div>
  )
}
