/**
 * Fight Profile Cards Component
 *
 * Displays 3 cards: Aggressiveness, Impact, Survival
 * Each card shows a score (0-100) and a descriptive label.
 */

import type { FightProfileScores } from '@/types/playerPerformance'

interface FightProfileCardsProps {
  fightProfile: FightProfileScores
}

export default function FightProfileCards({
  fightProfile,
}: FightProfileCardsProps): React.JSX.Element {
  // Check if all scores are null (insufficient data)
  const hasData =
    fightProfile.aggressivenessScore !== null ||
    fightProfile.impactScore !== null ||
    fightProfile.survivalScore !== null

  if (!hasData) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h3 className="mb-2 text-sm font-semibold text-neutral-200">
          Profilo Fight
        </h3>
        <div className="text-sm text-neutral-500">
          Dati insufficienti per calcolare il profilo dei fight su questo
          periodo.
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Card 1: Aggressività in Fight */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">
            Aggressività in Fight
          </h3>
          <span className="text-xs text-neutral-500">Presenza nei fight</span>
        </div>
        {fightProfile.aggressivenessScore !== null ? (
          <>
            <div className="mb-2 text-2xl font-bold text-white">
              {Math.round(fightProfile.aggressivenessScore)}/100
            </div>
            <div className="text-xs text-neutral-400">
              {fightProfile.aggressivenessLabel ?? '—'}
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-500">Dati insufficienti</div>
        )}
      </div>

      {/* Card 2: Impatto Fight */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">
            Impatto Fight
          </h3>
          <span className="text-xs text-neutral-500">Efficienza nei fight</span>
        </div>
        {fightProfile.impactScore !== null ? (
          <>
            <div className="mb-2 text-2xl font-bold text-white">
              {Math.round(fightProfile.impactScore)}/100
            </div>
            <div className="text-xs text-neutral-400">
              {fightProfile.impactLabel ?? '—'}
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-500">Dati insufficienti</div>
        )}
      </div>

      {/* Card 3: Sopravvivenza */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">
            Sopravvivenza
          </h3>
          <span className="text-xs text-neutral-500">
            Capacità di sopravvivenza
          </span>
        </div>
        {fightProfile.survivalScore !== null ? (
          <>
            <div className="mb-2 text-2xl font-bold text-white">
              {Math.round(fightProfile.survivalScore)}/100
            </div>
            <div className="text-xs text-neutral-400">
              {fightProfile.survivalLabel ?? '—'}
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-500">Dati insufficienti</div>
        )}
      </div>
    </div>
  )
}
