/**
 * Laning Block Component
 *
 * Displays laning phase (0-10 min) analysis
 */

import type { LaningAnalysis } from '@/types/matchAnalysis'

interface LaningBlockProps {
  data: LaningAnalysis
}

export function LaningBlock({ data }: LaningBlockProps): React.JSX.Element {
  if (data.status === 'unavailable') {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">
          Laning (0-10 min)
        </h2>
        <div className="text-sm text-neutral-500">
          Dati laning non disponibili. Richiedono timeline CS per minuto che non
          sono ancora disponibili da OpenDota.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Laning (0-10 min)
      </h2>

      {/* Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.csAt10 !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">CS @10</div>
            <div className="text-lg font-semibold text-neutral-100">
              {data.csAt10}
            </div>
          </div>
        )}
        {data.deniesAt10 !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Denies @10</div>
            <div className="text-lg font-semibold text-neutral-100">
              {data.deniesAt10}
            </div>
          </div>
        )}
        {data.networthAt10 !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Networth @10</div>
            <div className="text-lg font-semibold text-neutral-100">
              {data.networthAt10}
            </div>
          </div>
        )}
        {data.laneOutcome && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Esito Lane</div>
            <div
              className={`text-lg font-semibold ${
                data.laneOutcome === 'vinta'
                  ? 'text-green-400'
                  : data.laneOutcome === 'persa'
                    ? 'text-red-400'
                    : 'text-yellow-400'
              }`}
            >
              {data.laneOutcome === 'vinta'
                ? 'Vinta'
                : data.laneOutcome === 'persa'
                  ? 'Persa'
                  : 'Pari'}
            </div>
          </div>
        )}
      </div>

      {/* CS Timeline Chart - placeholder for future implementation */}
      {data.csTimeline && data.csTimeline.length > 0 && (
        <div className="mb-4 h-[200px]">
          {/* TODO: Implement CS timeline chart */}
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Grafico CS timeline (in sviluppo)
          </div>
        </div>
      )}

      {/* Insight */}
      {data.insight && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="mb-1 text-xs font-semibold text-neutral-300">
            Insight Laning
          </div>
          <div className="text-sm text-neutral-400">{data.insight}</div>
        </div>
      )}
    </div>
  )
}
