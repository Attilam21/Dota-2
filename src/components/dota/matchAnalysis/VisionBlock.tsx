/**
 * Vision Block Component
 *
 * Displays vision metrics
 */

import type { VisionAnalysis } from '@/types/matchAnalysis'
import { formatNumberOrNA } from '@/utils/dotaFormatting'

interface VisionBlockProps {
  data: VisionAnalysis
}

export function VisionBlock({ data }: VisionBlockProps): React.JSX.Element {
  if (data.status === 'unavailable') {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">Vision</h2>
        <div className="text-sm text-neutral-500">
          Dati vision non disponibili. Richiedono dati ward placement che non
          sono ancora disponibili da OpenDota.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">Vision</h2>

      {/* KPI Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.observerPlaced !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Observer Placed</div>
            <div className="text-lg font-semibold text-neutral-100">
              {formatNumberOrNA(data.observerPlaced)}
            </div>
          </div>
        )}
        {data.sentryPlaced !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Sentry Placed</div>
            <div className="text-lg font-semibold text-neutral-100">
              {formatNumberOrNA(data.sentryPlaced)}
            </div>
          </div>
        )}
        {data.wardsKilled !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Wards Killed</div>
            <div className="text-lg font-semibold text-neutral-100">
              {formatNumberOrNA(data.wardsKilled)}
            </div>
          </div>
        )}
        {data.avgWardDuration !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-xs text-neutral-400">Avg Ward Duration</div>
            <div className="text-lg font-semibold text-neutral-100">
              {formatNumberOrNA(data.avgWardDuration)}s
            </div>
          </div>
        )}
      </div>

      {/* Bar Chart */}
      {(data.observerPlaced !== null ||
        data.sentryPlaced !== null ||
        data.wardsKilled !== null) && (
        <div className="mb-4 h-[180px]">
          {/* TODO: Implement vision bar chart */}
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Grafico vision (in sviluppo)
          </div>
        </div>
      )}

      {/* Insight */}
      {data.insight && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="mb-1 text-xs font-semibold text-neutral-300">
            Insight Vision
          </div>
          <div className="text-sm text-neutral-400">{data.insight}</div>
        </div>
      )}
    </div>
  )
}
