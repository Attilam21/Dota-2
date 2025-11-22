/**
 * FZTH Coaching Repository
 *
 * Data access layer for coaching tasks in Supabase
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type {
  FzthPlayerTask,
  FzthCoachingTaskTemplate,
  FzthCoachingTaskStatus,
  GetPlayerTasksOptions,
  FzthCoachingImpactMetrics,
  FzthCoachingPillar,
} from './types'

/**
 * Get player tasks with optional filters
 */
export async function getPlayerTasks(
  playerId: number,
  options: GetPlayerTasksOptions = {},
): Promise<FzthPlayerTask[]> {
  const supabase = createServerClient(cookies())

  // Build query
  let query = supabase
    .from('fzth_player_tasks')
    .select(
      '*, fzth_coaching_tasks(id, code, title, description, pillar, difficulty, is_active, created_at, updated_at)',
    )
    .eq('player_account_id', playerId)

  // Filter by status
  if (options.status === 'active') {
    query = query.in('status', ['pending', 'in_progress'])
  } else if (options.status === 'completed') {
    query = query.eq('status', 'completed')
  }

  // Filter by pillar if specified
  if (options.pillar) {
    // We need to filter by the joined template's pillar
    // This requires a more complex query - for now, fetch all and filter in code
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    // Handle table not found gracefully - return empty array instead of throwing
    if (
      error.message?.includes('table') &&
      error.message?.includes('not found')
    ) {
      console.warn(
        '[COACHING-REPO] Table fzth_player_tasks not found, returning empty array',
      )
      return []
    }
    console.error('[COACHING-REPO] Error fetching tasks:', error)
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  // Map to FzthPlayerTask
  const tasks: FzthPlayerTask[] = []
  const now = new Date()

  for (const row of data || []) {
    const template = row.fzth_coaching_tasks as any
    if (!template || !template.is_active) continue

    // Filter by windowDays for completed tasks
    if (options.status === 'completed' && options.windowDays) {
      if (!row.completed_at) continue
      const completedDate = new Date(row.completed_at)
      const daysAgo =
        (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysAgo > options.windowDays) continue
    }

    // Filter by pillar if specified
    if (options.pillar && template.pillar !== options.pillar) continue

    tasks.push({
      id: row.id,
      playerAccountId: row.player_account_id,
      taskId: row.task_id,
      status: row.status as FzthCoachingTaskStatus,
      sourceMatchId: row.source_match_id ?? null,
      notes: row.notes ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at ?? null,
      template: {
        id: template.id,
        code: template.code,
        title: template.title,
        description: template.description ?? null,
        pillar: template.pillar as FzthCoachingPillar,
        difficulty: template.difficulty as 1 | 2 | 3,
        isActive: template.is_active,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      },
    })
  }

  return tasks
}

/**
 * Create tasks from profiling improvement pillars
 * Avoids duplicates: doesn't create new tasks if an active task already exists for the same pillar
 */
export async function createTasksFromProfiling(
  playerId: number,
  improvementPillars: Array<{
    pillarId: FzthCoachingPillar
    severity: 'high' | 'medium' | 'low'
  }>,
): Promise<FzthPlayerTask[]> {
  const supabase = createServerClient(cookies())

  // 1. Get existing active tasks for this player
  const existingTasks = await getPlayerTasks(playerId, { status: 'active' })
  const existingPillars = new Set(existingTasks.map((t) => t.template.pillar))

  // 2. Get available task templates for each pillar
  const { data: templatesData, error: templatesError } = await supabase
    .from('fzth_coaching_tasks')
    .select('*')
    .eq('is_active', true)
    .in(
      'pillar',
      improvementPillars.map((p) => p.pillarId),
    )

  if (templatesError) {
    // Handle table not found gracefully
    if (
      templatesError.message?.includes('table') &&
      templatesError.message?.includes('not found')
    ) {
      console.warn(
        '[COACHING-REPO] Table fzth_coaching_tasks not found, cannot create tasks',
      )
      return []
    }
    console.error('[COACHING-REPO] Error fetching templates:', templatesError)
    throw new Error(`Failed to fetch templates: ${templatesError.message}`)
  }

  // 3. Create tasks only for pillars without active tasks
  const newTasks: FzthPlayerTask[] = []
  const now = new Date().toISOString()

  for (const pillar of improvementPillars) {
    // Skip if already has active task for this pillar
    if (existingPillars.has(pillar.pillarId)) {
      continue
    }

    // Find a template for this pillar (prefer higher difficulty for high severity)
    const pillarTemplates = (templatesData || []).filter(
      (t) => t.pillar === pillar.pillarId,
    )

    if (pillarTemplates.length === 0) {
      console.warn(
        `[COACHING-REPO] No template found for pillar ${pillar.pillarId}`,
      )
      continue
    }

    // Select template based on severity
    let selectedTemplate = pillarTemplates[0]
    if (pillar.severity === 'high' && pillarTemplates.length > 1) {
      // Prefer higher difficulty for high severity
      selectedTemplate =
        pillarTemplates.find((t) => t.difficulty >= 2) || pillarTemplates[0]
    }

    // 4. Insert new player task
    const { data: newTask, error: insertError } = await supabase
      .from('fzth_player_tasks')
      .insert({
        player_account_id: playerId,
        task_id: selectedTemplate.id,
        status: 'pending',
        source_match_id: null,
        notes: `Task generato automaticamente dalla profiliazione (${pillar.severity} priority)`,
        created_at: now,
        updated_at: now,
        completed_at: null,
      })
      .select(
        '*, fzth_coaching_tasks(id, code, title, description, pillar, difficulty, is_active, created_at, updated_at)',
      )
      .single()

    if (insertError) {
      // Handle table not found gracefully
      if (
        insertError.message?.includes('table') &&
        insertError.message?.includes('not found')
      ) {
        console.warn(
          '[COACHING-REPO] Table fzth_player_tasks not found, cannot create tasks',
        )
        return []
      }
      console.error(
        `[COACHING-REPO] Error creating task for pillar ${pillar.pillarId}:`,
        insertError,
      )
      continue
    }

    const template = newTask.fzth_coaching_tasks as any
    newTasks.push({
      id: newTask.id,
      playerAccountId: newTask.player_account_id,
      taskId: newTask.task_id,
      status: newTask.status as FzthCoachingTaskStatus,
      sourceMatchId: newTask.source_match_id ?? null,
      notes: newTask.notes ?? null,
      createdAt: newTask.created_at,
      updatedAt: newTask.updated_at,
      completedAt: newTask.completed_at ?? null,
      template: {
        id: template.id,
        code: template.code,
        title: template.title,
        description: template.description ?? null,
        pillar: template.pillar as FzthCoachingPillar,
        difficulty: template.difficulty as 1 | 2 | 3,
        isActive: template.is_active,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      },
    })
  }

  return newTasks
}

/**
 * Mark task as completed
 */
export async function markTaskCompleted(
  taskId: string,
  matchId?: number,
): Promise<void> {
  const supabase = createServerClient(cookies())
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('fzth_player_tasks')
    .update({
      status: 'completed',
      completed_at: now,
      updated_at: now,
      ...(matchId && { source_match_id: matchId }),
    })
    .eq('id', taskId)

  if (error) {
    // Handle table not found gracefully
    if (
      error.message?.includes('table') &&
      error.message?.includes('not found')
    ) {
      console.warn(
        '[COACHING-REPO] Table fzth_player_tasks not found, cannot complete task',
      )
      return // Silently return instead of throwing
    }
    console.error('[COACHING-REPO] Error completing task:', error)
    throw new Error(`Failed to complete task: ${error.message}`)
  }
}

/**
 * Get coaching impact summary
 */
export async function getCoachingImpactSummary(
  playerId: number,
  windowDays: number = 30,
): Promise<FzthCoachingImpactMetrics> {
  const supabase = createServerClient(cookies())

  // Get all tasks for the player
  const allTasks = await getPlayerTasks(playerId, { status: 'all' })

  // Calculate active and completed
  const activeTasks = allTasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress',
  ).length

  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - windowDays)
  const completedTasks = allTasks.filter((t) => {
    if (t.status !== 'completed' || !t.completedAt) return false
    return new Date(t.completedAt) >= windowStart
  }).length

  // Calculate completion trend (weekly for last 4 weeks)
  const completionTrend: number[] = []
  for (let week = 3; week >= 0; week--) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (week + 1) * 7)
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() - week * 7)

    const weekCompletions = allTasks.filter((t) => {
      if (t.status !== 'completed' || !t.completedAt) return false
      const completedDate = new Date(t.completedAt)
      return completedDate >= weekStart && completedDate < weekEnd
    }).length

    completionTrend.push(weekCompletions)
  }

  // TODO: Calculate winrateDelta and fzthScoreDelta from profile snapshots
  // For now, return null
  return {
    activeTasks,
    completedTasks,
    completionTrend,
    winrateDelta: null,
    fzthScoreDelta: null,
  }
}
