/**
 * Profile Header Component
 *
 * Displays FZTH identity: level, score, role, playstyle
 */

import type { PlayerProfileIdentity } from '@/lib/dota/profile/types'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'

interface ProfileHeaderProps {
  data: PlayerProfileIdentity
}

export function ProfileHeader({ data }: ProfileHeaderProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full bg-blue-900/50 px-3 py-1 text-xs font-semibold text-blue-300">
              FZTH Level {data.fzthLevel}
            </span>
            <h1 className="text-2xl font-semibold text-neutral-100">
              {data.accountName || `Player ${data.playerId}`}
            </h1>
          </div>
          <div className="mb-4">
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-neutral-100">
                {data.fzthScore}
              </span>
              <span className="text-lg text-neutral-400">/100</span>
            </div>
            <div className="text-sm text-neutral-400">
              FZTH Score - Prossimo livello a {data.nextLevelScore}
            </div>
          </div>
          {data.mainRole && (
            <div className="mb-2">
              <span className="text-xs text-neutral-500">
                Ruolo principale:{' '}
              </span>
              <span className="text-sm font-medium text-neutral-300">
                {data.mainRole}
              </span>
            </div>
          )}
          {data.mainPlaystyle && (
            <div>
              <span className="text-xs text-neutral-500">Stile di gioco: </span>
              <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300">
                {data.mainPlaystyle}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar to next level */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
          <span>Progresso verso livello {data.fzthLevel + 1}</span>
          <span>{formatPercentageOrNA(data.progressToNext, 1)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${data.progressToNext}%` }}
          />
        </div>
      </div>
    </div>
  )
}
