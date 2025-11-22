/**
 * Match Header Block Component
 *
 * Displays match header with hero, role, result, and key stats
 */

import type { MatchHeader } from '@/types/matchAnalysis'
import { getHeroIconUrl } from '@/lib/dotaHeroes'
import { formatNumberOrNA } from '@/utils/dotaFormatting'

interface MatchHeaderBlockProps {
  data: MatchHeader
}

export function MatchHeaderBlock({
  data,
}: MatchHeaderBlockProps): React.JSX.Element {
  const heroIcon = getHeroIconUrl(data.heroId)
  const durationMinutes = Math.floor(data.durationSeconds / 60)
  const durationSeconds = data.durationSeconds % 60
  const durationFormatted = `${durationMinutes}:${String(
    durationSeconds,
  ).padStart(2, '0')}`

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                data.result === 'win'
                  ? 'bg-green-900/60 text-green-300'
                  : 'bg-red-900/60 text-red-300'
              }`}
            >
              {data.result === 'win' ? 'Vittoria' : 'Sconfitta'}
            </span>
            <h1 className="text-2xl font-semibold text-neutral-100">
              Partita #{data.matchId}
            </h1>
          </div>
          <p className="mb-3 text-sm text-neutral-400">
            Analisi FZTH – Player {data.matchId} –{' '}
            {new Date(data.startTime).toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            – Durata {durationFormatted}
          </p>
          <div className="flex items-center gap-3">
            {heroIcon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroIcon}
                alt={data.heroName}
                width={32}
                height={32}
                className="h-8 w-8 rounded"
                loading="lazy"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
            <span className="text-sm font-medium text-neutral-300">
              {data.heroName}
            </span>
            {data.roleLabel && (
              <>
                <span className="text-xs text-neutral-500">•</span>
                <span className="text-xs text-neutral-400">
                  {data.roleLabel}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <div className="text-xs text-neutral-400">K/D/A</div>
          <div className="text-lg font-semibold text-neutral-100">
            {data.kills} / {data.deaths} / {data.assists}
          </div>
          <div className="text-xs text-neutral-500">
            KDA: {data.kda.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-400">GPM / XPM</div>
          <div className="text-lg font-semibold text-neutral-100">
            {formatNumberOrNA(data.gpm)} / {formatNumberOrNA(data.xpm)}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-400">CS / Denies</div>
          <div className="text-lg font-semibold text-neutral-100">
            {formatNumberOrNA(data.lastHits)} / {formatNumberOrNA(data.denies)}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-400">Durata</div>
          <div className="text-lg font-semibold text-neutral-100">
            {durationFormatted}
          </div>
        </div>
      </div>
    </div>
  )
}
