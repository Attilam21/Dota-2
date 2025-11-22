/**
 * FZTH Coaching Types
 *
 * Types for coaching task management aligned with Supabase schema
 */

export type FzthCoachingPillar =
  | 'laning'
  | 'macro'
  | 'teamfight'
  | 'consistency'
  | 'hero_pool'

export type FzthCoachingTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'blocked'

/**
 * Coaching task template from fzth_coaching_tasks
 */
export interface FzthCoachingTaskTemplate {
  id: string // UUID
  code: string // Unique code (e.g., "LANING_CS_10MIN_V1")
  title: string
  description: string | null
  pillar: FzthCoachingPillar
  difficulty: 1 | 2 | 3
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Player task from fzth_player_tasks
 */
export interface FzthPlayerTask {
  id: string // UUID
  playerAccountId: number // bigint
  taskId: string // UUID reference to fzth_coaching_tasks
  status: FzthCoachingTaskStatus
  sourceMatchId: number | null // bigint, optional
  notes: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  // Joined template data
  template: FzthCoachingTaskTemplate
}

/**
 * Coaching impact metrics for summary
 */
export interface FzthCoachingImpactMetrics {
  activeTasks: number
  completedTasks: number
  completionTrend: number[] // Array of completion counts per period
  winrateDelta?: number | null
  fzthScoreDelta?: number | null
}

/**
 * Options for fetching player tasks
 */
export interface GetPlayerTasksOptions {
  status?: 'active' | 'completed' | 'all' // 'active' = pending | in_progress
  windowDays?: number // For completed tasks, only last N days
  pillar?: FzthCoachingPillar
}
