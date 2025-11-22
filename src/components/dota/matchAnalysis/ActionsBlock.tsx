/**
 * Actions Block Component
 *
 * Displays APM (Actions Per Minute) metrics
 */

import type { ActionsAnalysis } from '@/types/matchAnalysis'
import { formatNumberOrNA } from '@/utils/dotaFormatting'

interface ActionsBlockProps {
  data: ActionsAnalysis
}

export function ActionsBlock({ data }: ActionsBlockProps): React.JSX.Element {
  if (data.status === 'unavailable') {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">Actions</h2>
        <div className="text-sm text-neutral-500">
          Dati APM non disponibili. Richiedono tracking spell casts e item usage
          che non sono ancora disponibili da OpenDota.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">Actions</h2>

      {/* APM Card */}
      {data.apmTotal !== null && (
        <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="mb-2 text-sm font-medium text-neutral-300">
            APM Totale
          </div>
          <div className="text-2xl font-bold text-neutral-100">
            {formatNumberOrNA(data.apmTotal)}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Azioni per minuto utili (spell casts, item usage, ecc.)
          </div>
        </div>
      )}

      {/* APM by Phase */}
      {(data.apmByPhase.early !== null ||
        data.apmByPhase.mid !== null ||
        data.apmByPhase.late !== null) && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          {data.apmByPhase.early !== null && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-center">
              <div className="text-xs text-neutral-400">Early</div>
              <div className="text-lg font-semibold text-neutral-100">
                {formatNumberOrNA(data.apmByPhase.early)}
              </div>
            </div>
          )}
          {data.apmByPhase.mid !== null && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-center">
              <div className="text-xs text-neutral-400">Mid</div>
              <div className="text-lg font-semibold text-neutral-100">
                {formatNumberOrNA(data.apmByPhase.mid)}
              </div>
            </div>
          )}
          {data.apmByPhase.late !== null && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-center">
              <div className="text-xs text-neutral-400">Late</div>
              <div className="text-lg font-semibold text-neutral-100">
                {formatNumberOrNA(data.apmByPhase.late)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* APM Timeline Chart - placeholder for future implementation */}
      {data.apmTotal !== null && (
        <div className="mb-4 h-[200px]">
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Grafico APM per fase (in sviluppo)
          </div>
        </div>
      )}

      {/* Insight */}
      {data.insight && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="mb-1 text-xs font-semibold text-neutral-300">
            Insight Actions
          </div>
          <div className="text-sm text-neutral-400">{data.insight}</div>
        </div>
      )}
    </div>
  )
}
