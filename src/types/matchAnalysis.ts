/**
 * Match Analysis PRO Types (TIER 1 ONLY)
 *
 * Types for enterprise-grade match analysis using ONLY Tier 1 data
 * guaranteed by OpenDota API and existing Supabase tables.
 */

import type { RolePosition } from '@/types/dotaAnalysis'

/**
 * Match Header Data
 */
export interface MatchHeader {
  matchId: number
  heroId: number
  heroName: string
  rolePosition: RolePosition | null
  roleLabel: string | null
  result: 'win' | 'lose'
  kills: number
  deaths: number
  assists: number
  kda: number
  gpm: number | null
  xpm: number | null
  lastHits: number | null
  denies: number | null
  durationSeconds: number
  startTime: string
}

/**
 * Kill Distribution by Phase
 */
export interface KillDistribution {
  early: number // 0-10 min
  mid: number // 10-30 min
  late: number // 30+ min
  total: number
  percentages: {
    early: number // 0-100
    mid: number // 0-100
    late: number // 0-100
  }
  insight: string | null
}

/**
 * Laning Analysis (0-10 minutes)
 */
export interface LaningAnalysis {
  status: 'available' | 'unavailable'
  csAt10: number | null
  deniesAt10: number | null
  networthAt10: number | null
  laneOutcome: 'vinta' | 'pari' | 'persa' | null
  csTimeline: Array<{ minute: number; lastHits: number }> | null
  insight: string | null
}

/**
 * Farm & Scaling Analysis
 */
export interface FarmScalingAnalysis {
  status: 'available' | 'unavailable'
  gpmTimeline: Array<{ minute: number; gpm: number }> | null
  xpmTimeline: Array<{ minute: number; xpm: number }> | null
  midGameGpmAvg: number | null // 10-25 min
  lateGameGpmAvg: number | null // 25+ min
  recoveryScore: number | null // 0-100
  recoveryLabel: 'Basso' | 'Medio' | 'Alto' | null
  insight: string | null
}

/**
 * Build Analysis
 */
export interface BuildAnalysis {
  status: 'available' | 'unavailable'
  coreItems: Array<{
    itemId: number
    itemName: string
    purchaseMinute: number
    metaMinute: number | null // If available
    differenceMinutes: number | null // purchaseMinute - metaMinute
  }>
  insight: string | null
}

/**
 * Combat & Teamfights Analysis
 */
export interface CombatAnalysis {
  status: 'available' | 'unavailable'
  killParticipation: number | null // 0-100, (kills+assists)/teamKills
  heroDamage: number | null
  heroDamagePercent: number | null // vs team average
  damageTaken: number | null
  teamfightsParticipated: number | null
  teamfightsTotal: number | null
  insight: string | null
}

/**
 * Vision Analysis
 */
export interface VisionAnalysis {
  status: 'available' | 'unavailable'
  observerPlaced: number | null
  sentryPlaced: number | null
  wardsKilled: number | null
  avgWardDuration: number | null
  insight: string | null
}

/**
 * Objectives Analysis
 */
export interface ObjectivesAnalysis {
  status: 'available' | 'unavailable'
  towerParticipation: number | null // 0-100
  roshanParticipation: number | null // 0-100
  towerDamage: number | null
  insight: string | null
}

/**
 * Actions Analysis (APM)
 */
export interface ActionsAnalysis {
  status: 'available' | 'unavailable'
  apmTotal: number | null
  apmByPhase: {
    early: number | null
    mid: number | null
    late: number | null
  }
  insight: string | null
}

/**
 * Complete Match Analysis
 */
export interface MatchAnalysis {
  header: MatchHeader
  killDistribution: KillDistribution
  laning: LaningAnalysis
  farmScaling: FarmScalingAnalysis
  build: BuildAnalysis
  combat: CombatAnalysis
  vision: VisionAnalysis
  objectives: ObjectivesAnalysis
  actions: ActionsAnalysis
}
