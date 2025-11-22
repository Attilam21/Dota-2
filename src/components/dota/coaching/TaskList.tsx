/**
 * Task List Component
 *
 * Displays a list of player tasks in a table format
 */

import type { PlayerTask } from '@/lib/dota/coaching/types'
import {
  getStatusBadgeColor,
  getStatusLabel,
  getDifficultyStars,
  formatDateTime,
} from '@/lib/dota/coaching/utils'
import Link from 'next/link'

interface TaskListProps {
  tasks: PlayerTask[]
}

export function TaskList({ tasks }: TaskListProps): React.JSX.Element {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 text-center text-sm text-neutral-500">
        Nessun task disponibile
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-400">
              Task
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-400">
              Stato
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-400">
              Difficoltà
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-400">
              Match
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-400">
              Creato
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-400">
              Completato
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isActive =
              task.status === 'pending' || task.status === 'in_progress'

            return (
              <tr
                key={task.id}
                className={`border-b border-neutral-800/50 ${
                  isActive ? 'bg-neutral-900/30' : ''
                }`}
              >
                <td className="px-2 py-3">
                  <div className="font-medium text-neutral-200">
                    {task.template.title}
                  </div>
                  {task.template.description && (
                    <div className="mt-1 text-xs text-neutral-500">
                      {task.template.description}
                    </div>
                  )}
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                      task.status,
                    )}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                </td>
                <td className="px-2 py-3 text-xs text-neutral-400">
                  {getDifficultyStars(task.template.difficulty)}
                </td>
                <td className="px-2 py-3">
                  {task.sourceMatchId ? (
                    <Link
                      href={`/dashboard/matches/${task.sourceMatchId}`}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      Match {task.sourceMatchId}
                    </Link>
                  ) : (
                    <span className="text-xs text-neutral-500">—</span>
                  )}
                </td>
                <td className="px-2 py-3 text-xs text-neutral-500">
                  {formatDateTime(task.createdAt)}
                </td>
                <td className="px-2 py-3 text-xs text-neutral-500">
                  {task.completedAt ? formatDateTime(task.completedAt) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
