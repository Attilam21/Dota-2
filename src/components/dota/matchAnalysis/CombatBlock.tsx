/**
 * Combat & Teamfights Block Component
 *
 * Displays combat metrics and teamfight participation
 */

import type { CombatAnalysis } from '@/types/matchAnalysis'
import { formatPercentageOrNA, formatNumberOrNA } from '@/utils/dotaFormatting'

interface CombatBlockProps {
  data: CombatAnalysis
}

export function CombatBlock({ data }: CombatBlockProps): React.JSX.Element {
  if (data.status === 'unavailable') {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">
          Combat & Teamfights
        </h2>
        <div className="text-sm text-neutral-500">
          Dati combat non disponibili per questa partita.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Combat & Teamfights
      </h2>

      {/* KPI Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.killParticipation !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Kill Participation</div>
            <div className="text-lg font-semibold text-neutral-100">
              {formatPercentageOrNA(data.killParticipation, 1)}
            </div>
          </div>
        )}
        {data.heroDamage !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Hero Damage</div>
            <div className="text-lg font-semibold text-neutral-100">
              {formatNumberOrNA(data.heroDamage)}
            </div>
            {data.heroDamagePercent !== null && (
              <div className="text-xs text-neutral-500">
                {formatPercentageOrNA(data.heroDamagePercent, 1)} vs team avg
              </div>
            )}
          </div>
        )}
        {data.damageTaken !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Damage Taken</div>
            <div className="text-lg font-semibold text-neutral-100">
              {formatNumberOrNA(data.damageTaken)}
            </div>
          </div>
        )}
        {data.teamfightsParticipated !== null &&
          data.teamfightsTotal !== null && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <div className="text-xs text-neutral-400">Teamfights</div>
              <div className="text-lg font-semibold text-neutral-100">
                {data.teamfightsParticipated} / {data.teamfightsTotal}
              </div>
            </div>
          )}
      </div>

      {/* Fight Impact Chart - placeholder for future implementation */}
      {data.teamfightsParticipated !== null &&
        data.teamfightsParticipated > 0 && (
          <div className="mb-4 h-[200px]">
            <div className="flex h-full items-center justify-center text-sm text-neutral-500">
              Grafico impatto teamfight (in sviluppo)
            </div>
          </div>
        )}

      {/* Insight */}
      {data.insight && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="mb-1 text-xs font-semibold text-neutral-300">
            Insight Combat
          </div>
          <div className="text-sm text-neutral-400">{data.insight}</div>
        </div>
      )}
    </div>
  )
}
