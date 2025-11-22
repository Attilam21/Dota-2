/**
 * Player Profile Types (TIER 1 ONLY)
 *
 * Types for FZTH Player Profile using only Tier 1 data
 */

export type ProfilePillarId =
  | 'laning'
  | 'macro'
  | 'teamfight'
  | 'consistency'
  | 'hero_pool'

export interface PlayerProfileIdentity {
  playerId: number
  accountName?: string | null
  fzthLevel: number // 1-10
  fzthScore: number // 0-100
  nextLevelScore: number // threshold for next level
  progressToNext: number // 0-100, percentage
  mainRole?: string | null
  mainPlaystyle?: string | null
}

export interface ProfilePillar {
  id: ProfilePillarId
  label: string
  description: string
  score: number // 0-100
  trend: 'up' | 'flat' | 'down'
  insight: string // max 1 line
}

export interface TasksSummary {
  total: number
  completed: number
  inProgress: number
  blocked: number
  completionRate: number // 0-100
  byPillar: Array<{
    pillarId: ProfilePillarId
    total: number
    completed: number
  }>
}

export interface ProgressPoint {
  periodLabel: string // e.g. "Ultimi 7 gg", "Settimana 42"
  fzthScore: number
  winrate?: number | null
  avgKda?: number | null
  tasksCompleted?: number | null
}

export interface FocusArea {
  pillarId: ProfilePillarId
  title: string
  severity: 'high' | 'medium' | 'low'
  rationale: string
  suggestedActionLabel: string
  suggestedActionHref: string
}

export interface PlayerProfileAggregate {
  identity: PlayerProfileIdentity
  pillars: ProfilePillar[]
  tasks: TasksSummary
  progress: ProgressPoint[]
  focusAreas: FocusArea[]
}
