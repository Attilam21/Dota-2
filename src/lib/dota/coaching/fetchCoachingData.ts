/**
 * Fetch Coaching Dashboard Data (TIER 1 ONLY)
 *
 * Fetches data from fzth_coaching_tasks and fzth_player_tasks tables
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type {
  CoachingDashboardData,
  TasksByPillar,
  PlayerTask,
  CoachingTaskTemplate,
  CoachingImpact,
  CoachingPillarId,
  CoachingTaskStatus,
} from './types'
import { getPillarLabel } from './utils'

/**
 * Fetch coaching dashboard data for a player
 */
export async function getCoachingDashboardData(
  playerAccountId: number,
): Promise<CoachingDashboardData> {
  const supabase = createServerClient(cookies())

  // 1. Fetch active coaching task templates
  const { data: templatesData, error: templatesError } = await supabase
    .from('fzth_coaching_tasks')
    .select('*')
    .eq('is_active', true)

  if (templatesError) {
    console.error('[COACHING] Error fetching templates:', templatesError)
  }

  const templates: CoachingTaskTemplate[] =
    (templatesData || []).map((t) => ({
      id: t.id,
      code: t.code,
      title: t.title,
      description: t.description ?? null,
      pillar: t.pillar as CoachingPillarId,
      difficulty: t.difficulty as 1 | 2 | 3,
      isActive: t.is_active,
    })) || []

  // 2. Fetch player tasks
  const { data: playerTasksData, error: playerTasksError } = await supabase
    .from('fzth_player_tasks')
    .select('*')
    .eq('player_account_id', playerAccountId)

  if (playerTasksError) {
    console.error('[COACHING] Error fetching player tasks:', playerTasksError)
  }

  // 3. Join player tasks with templates
  const playerTasks: PlayerTask[] = []
  const templateMap = new Map<string, CoachingTaskTemplate>()
  templates.forEach((t) => templateMap.set(t.id, t))
  ;(playerTasksData || []).forEach((pt) => {
    const template = templateMap.get(pt.task_id)
    if (template) {
      playerTasks.push({
        id: pt.id,
        playerAccountId: pt.player_account_id,
        taskId: pt.task_id,
        status: pt.status as CoachingTaskStatus,
        sourceMatchId: pt.source_match_id ?? null,
        notes: pt.notes ?? null,
        createdAt: pt.created_at,
        updatedAt: pt.updated_at,
        completedAt: pt.completed_at ?? null,
        template,
      })
    }
  })

  // 4. Calculate active tasks count
  const activeTasksCount = playerTasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress',
  ).length

  // 5. Calculate completed tasks in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const completedTasksCountLast30d = playerTasks.filter((t) => {
    if (t.status !== 'completed' || !t.completedAt) return false
    const completedDate = new Date(t.completedAt)
    return completedDate >= thirtyDaysAgo
  }).length

  // 6. Group tasks by pillar
  const pillarMap = new Map<CoachingPillarId, PlayerTask[]>()
  playerTasks.forEach((task) => {
    const pillar = task.template.pillar
    const existing = pillarMap.get(pillar) || []
    existing.push(task)
    pillarMap.set(pillar, existing)
  })

  const tasksByPillar: TasksByPillar[] = Array.from(pillarMap.entries()).map(
    ([pillarId, tasks]) => {
      const completed = tasks.filter((t) => t.status === 'completed').length
      const inProgress = tasks.filter(
        (t) => t.status === 'in_progress' || t.status === 'pending',
      ).length
      const blocked = tasks.filter((t) => t.status === 'blocked').length

      return {
        pillarId,
        pillarLabel: getPillarLabel(pillarId),
        total: tasks.length,
        completed,
        inProgress,
        blocked,
        tasks,
      }
    },
  )

  // Sort by pillar order
  const pillarOrder: CoachingPillarId[] = [
    'laning',
    'macro',
    'teamfight',
    'consistency',
    'hero_pool',
  ]
  tasksByPillar.sort(
    (a, b) => pillarOrder.indexOf(a.pillarId) - pillarOrder.indexOf(b.pillarId),
  )

  // 7. Calculate impact (placeholder for now)
  const impact: CoachingImpact = {
    periodLabel: 'Ultimi 30 giorni',
    matchesConsidered: 0,
    tasksCompleted: completedTasksCountLast30d,
    avgFzthScoreBefore: null,
    avgFzthScoreAfter: null,
    winrateBefore: null,
    winrateAfter: null,
    summaryText:
      "L'impatto del coaching verrà calcolato non appena saranno disponibili dati sufficienti.",
  }

  return {
    playerAccountId,
    activeTasksCount,
    completedTasksCountLast30d,
    tasksByPillar,
    impact,
  }
}
