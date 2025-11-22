/**
 * Coaching & Task Types (TIER 1 ONLY)
 *
 * Types for FZTH Coaching Dashboard using fzth_coaching_tasks and fzth_player_tasks
 */

export type CoachingPillarId =
  | 'laning'
  | 'macro'
  | 'teamfight'
  | 'consistency'
  | 'hero_pool'

export type CoachingTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'blocked'

export interface CoachingTaskTemplate {
  id: string // UUID fzth_coaching_tasks.id
  code: string // fzth_coaching_tasks.code
  title: string
  description?: string | null
  pillar: CoachingPillarId
  difficulty: 1 | 2 | 3
  isActive: boolean
}

export interface PlayerTask {
  id: string // fzth_player_tasks.id
  playerAccountId: number
  taskId: string
  status: CoachingTaskStatus
  sourceMatchId?: number | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  template: CoachingTaskTemplate // join al master
}

export interface TasksByPillar {
  pillarId: CoachingPillarId
  pillarLabel: string
  total: number
  completed: number
  inProgress: number
  blocked: number
  tasks: PlayerTask[]
}

export interface CoachingImpact {
  periodLabel: string // es. "Ultimi 30 giorni"
  matchesConsidered: number
  tasksCompleted: number
  avgFzthScoreBefore?: number | null
  avgFzthScoreAfter?: number | null
  winrateBefore?: number | null
  winrateAfter?: number | null
  summaryText: string
}

export interface CoachingDashboardData {
  playerAccountId: number
  activeTasksCount: number
  completedTasksCountLast30d: number
  tasksByPillar: TasksByPillar[]
  impact: CoachingImpact
}
