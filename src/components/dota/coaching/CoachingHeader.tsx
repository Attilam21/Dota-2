/**
 * Coaching Header Component
 *
 * Displays header with active tasks count and completed tasks in last 30 days
 */

import type { CoachingDashboardData } from '@/lib/dota/coaching/types'

interface CoachingHeaderProps {
  data: CoachingDashboardData
}

export function CoachingHeader({
  data,
}: CoachingHeaderProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-neutral-100">
          Coaching & Task FZTH
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Pianificazione e stato del tuo percorso di miglioramento.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-lg border border-blue-800/50 bg-blue-900/20 px-4 py-2">
          <div className="text-xs text-blue-300">Task attivi</div>
          <div className="text-xl font-bold text-blue-200">
            {data.activeTasksCount}
          </div>
        </div>
        <div className="rounded-lg border border-green-800/50 bg-green-900/20 px-4 py-2">
          <div className="text-xs text-green-300">Task completati (30 gg)</div>
          <div className="text-xl font-bold text-green-200">
            {data.completedTasksCountLast30d}
          </div>
        </div>
      </div>
    </div>
  )
}
