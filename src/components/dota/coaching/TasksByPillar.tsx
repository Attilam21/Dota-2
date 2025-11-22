/**
 * Tasks By Pillar Component
 *
 * Displays tasks grouped by pillar with expandable task lists
 * Supports auto-expansion based on URL query parameter
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { CoachingDashboardData } from '@/lib/dota/coaching/types'
import { TaskList } from './TaskList'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'

interface TasksByPillarProps {
  data: CoachingDashboardData
}

export function TasksByPillar({ data }: TasksByPillarProps): React.JSX.Element {
  const searchParams = useSearchParams()
  const pillarParam = searchParams.get('pillar')

  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set())

  // Auto-expand pillar from query param
  useEffect(() => {
    if (pillarParam) {
      setExpandedPillars(new Set([pillarParam]))
    }
  }, [pillarParam])

  const togglePillar = (pillarId: string) => {
    const newExpanded = new Set(expandedPillars)
    if (newExpanded.has(pillarId)) {
      newExpanded.delete(pillarId)
    } else {
      newExpanded.add(pillarId)
    }
    setExpandedPillars(newExpanded)
  }

  if (data.tasksByPillar.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-200">
          Task per Pilastro
        </h2>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-center">
          <div className="text-sm text-neutral-400">
            Non hai ancora task assegnati. I task verranno generati
            automaticamente dalla profiliazione quando entrerai in questa
            pagina.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Task per Pilastro
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.tasksByPillar.map((pillar) => {
          const isExpanded = expandedPillars.has(pillar.pillarId)
          const completionRate =
            pillar.total > 0
              ? Math.round((pillar.completed / pillar.total) * 100)
              : 0
          const isHighlighted = pillarParam === pillar.pillarId

          return (
            <div
              key={pillar.pillarId}
              className={`rounded-lg border p-4 ${
                isHighlighted
                  ? 'border-blue-600/50 bg-blue-900/20'
                  : 'border-neutral-800 bg-neutral-900/50'
              }`}
            >
              {/* Header */}
              <div className="mb-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-200">
                    {pillar.pillarLabel}
                    {isHighlighted && (
                      <span className="ml-2 text-xs text-blue-300">
                        (da profiliazione)
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-neutral-500">
                    {pillar.total} task
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
                    <span>Completamento</span>
                    <span>{formatPercentageOrNA(completionRate, 0)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        completionRate >= 70
                          ? 'bg-green-600'
                          : completionRate >= 50
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                      }`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-neutral-500">Totali</div>
                    <div className="font-semibold text-neutral-200">
                      {pillar.total}
                    </div>
                  </div>
                  <div>
                    <div className="text-green-300">Completati</div>
                    <div className="font-semibold text-green-200">
                      {pillar.completed}
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-300">In corso</div>
                    <div className="font-semibold text-blue-200">
                      {pillar.inProgress}
                    </div>
                  </div>
                  <div>
                    <div className="text-red-300">Bloccati</div>
                    <div className="font-semibold text-red-200">
                      {pillar.blocked}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expand/Collapse Button */}
              {pillar.tasks.length > 0 && (
                <button
                  onClick={() => togglePillar(pillar.pillarId)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-xs font-medium text-neutral-300 transition-all hover:bg-neutral-800 hover:text-neutral-200"
                >
                  {isExpanded ? 'Nascondi dettagli' : 'Vedi dettagli'} (
                  {pillar.tasks.length})
                </button>
              )}

              {/* Task List (Expanded) */}
              {isExpanded && pillar.tasks.length > 0 && (
                <div className="mt-4">
                  <TaskList tasks={pillar.tasks} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
