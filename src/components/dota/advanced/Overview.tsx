/**
 * Overview Component
 *
 * Displays overview metrics (KDA, GPM/XPM, CS/Denies, etc.)
 */

import type { OverviewAnalysisData } from '@/lib/dota/analysis/computeOverview'
import { formatNumberOrNA, formatPercentageOrNA } from '@/utils/dotaFormatting'

interface OverviewProps {
  data: OverviewAnalysisData
}

export function Overview({ data }: OverviewProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">Overview</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-400">K/D/A</div>
          <div className="text-xl font-bold text-neutral-100">{data.kda}</div>
          <div className="text-xs text-neutral-500">
            KDA: {data.kdaRatio.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-400">GPM / XPM</div>
          <div className="text-xl font-bold text-neutral-100">
            {formatNumberOrNA(data.gpm)} / {formatNumberOrNA(data.xpm)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-400">CS / Denies</div>
          <div className="text-xl font-bold text-neutral-100">
            {formatNumberOrNA(data.lastHits)} / {formatNumberOrNA(data.denies)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-400">Hero Damage</div>
          <div className="text-xl font-bold text-neutral-100">
            {formatNumberOrNA(data.heroDamage)}
          </div>
        </div>
        {data.heroHealing !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">Healing Done</div>
            <div className="text-xl font-bold text-neutral-100">
              {formatNumberOrNA(data.heroHealing)}
            </div>
          </div>
        )}
        {data.goldWasted !== null && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-400">Gold Wasted</div>
            <div className="text-xl font-bold text-neutral-100">
              {formatNumberOrNA(data.goldWasted)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
