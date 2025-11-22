/**
 * Profile Tasks Summary Component
 *
 * Displays task statistics and completion rates
 */

import type { TasksSummary } from '@/lib/dota/profile/types'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'

interface ProfileTasksSummaryProps {
  data: TasksSummary
}

const pillarLabels: Record<string, string> = {
  laning: 'Laning & Farm',
  macro: 'Macro & Objectives',
  teamfight: 'Teamfight',
  consistency: 'Consistenza',
  hero_pool: 'Hero Pool & Meta',
}

export function ProfileTasksSummary({
  data,
}: ProfileTasksSummaryProps): React.JSX.Element {
  if (data.total === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-200">
          Task di Coaching
        </h2>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-center">
          <div className="text-sm text-neutral-400">
            Task non ancora configurati per questo account
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            I task di coaching verranno attivati a breve.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Task di Coaching
      </h2>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-400">Totali</div>
          <div className="text-2xl font-bold text-neutral-100">
            {data.total}
          </div>
        </div>
        <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-4">
          <div className="text-xs text-green-300">Completati</div>
          <div className="text-2xl font-bold text-green-200">
            {data.completed}
          </div>
        </div>
        <div className="rounded-lg border border-yellow-800/50 bg-yellow-900/20 p-4">
          <div className="text-xs text-yellow-300">In corso</div>
          <div className="text-2xl font-bold text-yellow-200">
            {data.inProgress}
          </div>
        </div>
        <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-4">
          <div className="text-xs text-red-300">Bloccati</div>
          <div className="text-2xl font-bold text-red-200">{data.blocked}</div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-neutral-400">
          <span>Tasso di completamento</span>
          <span className="font-semibold text-neutral-200">
            {formatPercentageOrNA(data.completionRate, 1)}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className={`h-full transition-all duration-300 ${
              data.completionRate >= 70
                ? 'bg-green-600'
                : data.completionRate >= 50
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
            }`}
            style={{ width: `${data.completionRate}%` }}
          />
        </div>
      </div>

      {/* Tasks by Pillar */}
      {data.byPillar.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-300">
            Task per Pilastro
          </h3>
          <div className="space-y-2">
            {data.byPillar.map((pillar) => (
              <div
                key={pillar.pillarId}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 p-3"
              >
                <span className="text-sm text-neutral-300">
                  {pillarLabels[pillar.pillarId] || pillar.pillarId}
                </span>
                <span className="text-sm font-medium text-neutral-200">
                  {pillar.completed} / {pillar.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
