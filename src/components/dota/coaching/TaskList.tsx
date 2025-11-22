/**
 * Task List Component
 *
 * Displays a list of player tasks in a table format with completion action
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)

  const handleCompleteTask = async (taskId: string) => {
    if (!confirm('Sei sicuro di voler segnare questo task come completato?')) {
      return
    }

    try {
      setCompletingTaskId(taskId)
      const res = await fetch('/api/coaching/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg?.error || `HTTP ${res.status}`)
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (e: any) {
      console.error('[TASK-LIST] Error completing task:', e)
      alert(
        `Errore nel completare il task: ${e?.message ?? 'Errore sconosciuto'}`,
      )
    } finally {
      setCompletingTaskId(null)
    }
  }

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
              Azioni
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isActive =
              task.status === 'pending' || task.status === 'in_progress'
            const isCompleting = completingTaskId === task.id
            const isFromProfiling = task.notes?.includes('profilazione')

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
                  {isFromProfiling && (
                    <div className="mt-1">
                      <span className="inline-block rounded-full border border-blue-800/50 bg-blue-900/20 px-2 py-0.5 text-xs text-blue-300">
                        Derivato dalla profiliazione
                      </span>
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
                <td className="px-2 py-3">
                  {isActive && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={isCompleting}
                      className="rounded-md border border-green-700 bg-green-900/20 px-2 py-1 text-xs font-medium text-green-300 transition-all hover:bg-green-900/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCompleting ? 'Completamento...' : 'Segna completato'}
                    </button>
                  )}
                  {task.status === 'completed' && task.completedAt && (
                    <span className="text-xs text-neutral-500">
                      {formatDateTime(task.completedAt)}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
