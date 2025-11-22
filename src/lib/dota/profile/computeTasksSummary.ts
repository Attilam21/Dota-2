/**
 * Compute Tasks Summary (TIER 1 ONLY)
 *
 * Calculates task statistics from dota_tasks table
 */

import type { TasksSummary } from './types'
import type { ProfilePillarId } from './types'

interface DotaTask {
  id: string
  player_account_id: number
  type: string
  status:
    | 'open'
    | 'completed'
    | 'failed'
    | 'pending'
    | 'in_progress'
    | 'blocked'
  category?: string | null
}

/**
 * Compute tasks summary from tasks data
 */
export async function computeTasksSummary(
  playerId: number,
  tasks: DotaTask[] = [],
): Promise<TasksSummary> {
  // If no tasks, return placeholder
  if (tasks.length === 0) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      blocked: 0,
      completionRate: 0,
      byPillar: [],
    }
  }

  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed').length
  const inProgress = tasks.filter(
    (t) =>
      t.status === 'open' ||
      t.status === 'in_progress' ||
      t.status === 'pending',
  ).length
  const blocked = tasks.filter(
    (t) => t.status === 'failed' || t.status === 'blocked',
  ).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  // Map tasks to pillars (simplified mapping)
  const pillarMap: Record<string, ProfilePillarId> = {
    laning: 'laning',
    farm: 'laning',
    macro: 'macro',
    objective: 'macro',
    teamfight: 'teamfight',
    fight: 'teamfight',
    consistency: 'consistency',
    hero: 'hero_pool',
    hero_pool: 'hero_pool',
  }

  const byPillarMap = new Map<
    ProfilePillarId,
    { total: number; completed: number }
  >()

  tasks.forEach((task) => {
    const category = (task.category || task.type || '').toLowerCase()
    let pillarId: ProfilePillarId = 'laning' // default

    // Try to map category to pillar
    for (const [key, value] of Object.entries(pillarMap)) {
      if (category.includes(key)) {
        pillarId = value
        break
      }
    }

    const current = byPillarMap.get(pillarId) || { total: 0, completed: 0 }
    byPillarMap.set(pillarId, {
      total: current.total + 1,
      completed: current.completed + (task.status === 'completed' ? 1 : 0),
    })
  })

  const byPillar: Array<{
    pillarId: ProfilePillarId
    total: number
    completed: number
  }> = Array.from(byPillarMap.entries()).map(([pillarId, data]) => ({
    pillarId,
    ...data,
  }))

  return {
    total,
    completed,
    inProgress,
    blocked,
    completionRate,
    byPillar,
  }
}
