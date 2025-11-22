/**
 * Objectives Block Component
 *
 * Displays objective participation metrics
 */

import type { ObjectivesAnalysis } from '@/types/matchAnalysis'
import { formatPercentageOrNA, formatNumberOrNA } from '@/utils/dotaFormatting'

interface ObjectivesBlockProps {
  data: ObjectivesAnalysis
}

export function ObjectivesBlock({
  data,
}: ObjectivesBlockProps): React.JSX.Element {
  if (data.status === 'unavailable') {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">
          Obiettivi
        </h2>
        <div className="text-sm text-neutral-500">
          Dati obiettivi non disponibili per questa partita.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">Obiettivi</h2>

      {/* KPI Cards */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {data.towerParticipation !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-sm font-medium text-neutral-300">
              Partecipazione Torri
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatPercentageOrNA(data.towerParticipation, 1)}
            </div>
            {data.towerDamage !== null && (
              <div className="mt-2 text-xs text-neutral-500">
                Danno torri: {formatNumberOrNA(data.towerDamage)}
              </div>
            )}
          </div>
        )}
        {data.roshanParticipation !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-sm font-medium text-neutral-300">
              Partecipazione Roshan
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {formatPercentageOrNA(data.roshanParticipation, 1)}
            </div>
          </div>
        )}
      </div>

      {/* Bar Chart - placeholder for future implementation */}
      {(data.towerParticipation !== null ||
        data.roshanParticipation !== null) && (
        <div className="mb-4 h-[180px]">
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Grafico partecipazione obiettivi (in sviluppo)
          </div>
        </div>
      )}

      {/* Insight */}
      {data.insight && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="mb-1 text-xs font-semibold text-neutral-300">
            Insight Obiettivi
          </div>
          <div className="text-sm text-neutral-400">{data.insight}</div>
        </div>
      )}
    </div>
  )
}
