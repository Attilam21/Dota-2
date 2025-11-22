/**
 * Farm & Scaling Block Component
 *
 * Displays farm scaling metrics and recovery score
 */

import type { FarmScalingAnalysis } from '@/types/matchAnalysis'
import { formatNumberOrNA } from '@/utils/dotaFormatting'

interface FarmScalingBlockProps {
  data: FarmScalingAnalysis
}

export function FarmScalingBlock({
  data,
}: FarmScalingBlockProps): React.JSX.Element {
  if (data.status === 'unavailable') {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">
          Farm & Scaling
        </h2>
        <div className="text-sm text-neutral-500">
          Dati farm scaling non disponibili. Richiedono timeline GPM/XPM per
          minuto.
        </div>
      </div>
    )
  }

  // Prepare chart data if timeline available
  // Note: LineChart component expects simple array format
  // For now, we'll show placeholder until timeline data is available
  const hasTimelineData = data.gpmTimeline && data.gpmTimeline.length > 0

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Farm & Scaling
      </h2>

      {/* Recovery Index Card */}
      {data.recoveryScore !== null && (
        <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-neutral-300">
              Recovery Index
            </div>
            <div
              className={`text-2xl font-bold ${
                data.recoveryLabel === 'Alto'
                  ? 'text-green-400'
                  : data.recoveryLabel === 'Medio'
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {data.recoveryScore}/100
            </div>
          </div>
          <div className="text-xs text-neutral-400">
            {data.recoveryLabel || 'N/A'}
          </div>
          {data.midGameGpmAvg !== null && data.lateGameGpmAvg !== null && (
            <div className="mt-2 text-xs text-neutral-500">
              GPM medio Mid: {formatNumberOrNA(data.midGameGpmAvg)} • Late:{' '}
              {formatNumberOrNA(data.lateGameGpmAvg)}
            </div>
          )}
        </div>
      )}

      {/* Timeline Chart */}
      {hasTimelineData ? (
        <div className="mb-4 h-[260px]">
          {/* TODO: Implement multi-line chart for GPM/XPM timeline */}
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Grafico timeline GPM/XPM (in sviluppo)
          </div>
        </div>
      ) : (
        <div className="mb-4 flex h-[260px] items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/50 text-sm text-neutral-500">
          Timeline GPM/XPM non disponibile per questa partita.
        </div>
      )}

      {/* Insight */}
      {data.insight && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="mb-1 text-xs font-semibold text-neutral-300">
            Insight Farm & Scaling
          </div>
          <div className="text-sm text-neutral-400">{data.insight}</div>
        </div>
      )}
    </div>
  )
}
