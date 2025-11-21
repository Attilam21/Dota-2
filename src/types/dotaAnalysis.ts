/**
 * Dota 2 Player Match Analysis Types
 *
 * Types for detailed Dota 2 player match analysis including:
 * - Kill/death distribution by game phase
 * - Death cost analysis (gold/xp/cs lost)
 * - Death by role analysis
 * - Death events with positions (optional)
 */

/**
 * Dota 2 Role Position
 * Pos 1: Safe Lane Carry
 * Pos 2: Mid
 * Pos 3: Offlane
 * Pos 4: Soft Support/Roamer
 * Pos 5: Hard Support
 */
export type RolePosition = 1 | 2 | 3 | 4 | 5

/**
 * Game Phase
 * Early: 0-10 minutes
 * Mid: 10-30 minutes
 * Late: 30+ minutes
 */
export type GamePhase = 'early' | 'mid' | 'late'

/**
 * Individual death event for a player in a match
 */
export interface DotaPlayerDeathEvent {
  /** OpenDota match ID */
  matchId: number
  /** Dota 2 account ID (Steam32) */
  accountId: number
  /** Second of death in match (0 = start) */
  timeSeconds: number
  /** Game phase when death occurred */
  phase: GamePhase
  /** Player level at time of death (1-30) */
  levelAtDeath: number
  /** Estimated respawn time in seconds */
  downtimeSeconds: number
  /** Estimated gold lost during downtime */
  goldLost: number
  /** Estimated XP lost during downtime */
  xpLost: number
  /** Estimated CS lost during downtime */
  csLost: number
  /** Hero ID of the killer (if available) */
  killerHeroId?: number
  /** Role position of killer (1-5, if available) */
  killerRolePosition?: RolePosition
  /** X position on map at death (optional, if available from OpenDota) */
  posX?: number
  /** Y position on map at death (optional, if available from OpenDota) */
  posY?: number
}

/**
 * Kill/death distribution by game phase
 */
export interface PhaseDistribution {
  /** Count in early phase (0-10 minutes) */
  early: number
  /** Count in mid phase (10-30 minutes) */
  mid: number
  /** Count in late phase (30+ minutes) */
  late: number
}

/**
 * Percentage distribution by game phase
 */
export interface PhasePercentageDistribution {
  /** Percentage in early phase (0-100) */
  early: number
  /** Percentage in mid phase (0-100) */
  mid: number
  /** Percentage in late phase (0-100) */
  late: number
}

/**
 * Death cost summary (total resources lost due to deaths)
 */
export interface DeathCostSummary {
  /** Total gold lost due to all deaths */
  totalGoldLost: number
  /** Total XP lost due to all deaths */
  totalXpLost: number
  /** Total CS lost due to all deaths */
  totalCsLost: number
}

/**
 * Death by role distribution (percentage of deaths caused by each role)
 */
export interface DeathByRole {
  /** Percentage of deaths caused by Pos1 (Safe Lane Carry) opponents (0-100) */
  pos1: number
  /** Percentage of deaths caused by Pos2 (Mid) opponents (0-100) */
  pos2: number
  /** Percentage of deaths caused by Pos3 (Offlane) opponents (0-100) */
  pos3: number
  /** Percentage of deaths caused by Pos4 (Soft Support) opponents (0-100) */
  pos4: number
  /** Percentage of deaths caused by Pos5 (Hard Support) opponents (0-100) */
  pos5: number
}

/**
 * Complete player match analysis for Dota 2
 * Maps to dota_player_match_analysis table in Supabase
 */
export interface DotaPlayerMatchAnalysis {
  /** OpenDota match ID */
  matchId: number
  /** Dota 2 account ID (Steam32) */
  accountId: number
  /** Role position played (1-5) */
  rolePosition: RolePosition
  /** Kill distribution by game phase */
  killDistribution: PhaseDistribution
  /** Kill percentage distribution by game phase */
  killPercentageDistribution: PhasePercentageDistribution
  /** Death distribution by game phase */
  deathDistribution: PhaseDistribution
  /** Death percentage distribution by game phase */
  deathPercentageDistribution: PhasePercentageDistribution
  /** Death cost summary (total resources lost) */
  deathCostSummary: DeathCostSummary
  /** Death by role distribution (percentage) */
  deathByRole: DeathByRole
  /** Optional: array of individual death events for detailed analysis */
  deathEvents?: DotaPlayerDeathEvent[]
  /** Optional: extra analysis data (e.g., heatmap, additional metrics) */
  analysisExtra?: Record<string, unknown>
}

/**
 * Helper function to determine game phase from time in seconds
 */
export function getGamePhase(timeSeconds: number): GamePhase {
  if (timeSeconds <= 600) {
    // 0-10 minutes
    return 'early'
  } else if (timeSeconds <= 1800) {
    // 10-30 minutes
    return 'mid'
  } else {
    // 30+ minutes
    return 'late'
  }
}

/**
 * Helper function to get role position label
 */
export function getRolePositionLabel(position: RolePosition): string {
  const labels: Record<RolePosition, string> = {
    1: 'Safe Lane Carry',
    2: 'Mid',
    3: 'Offlane',
    4: 'Soft Support',
    5: 'Hard Support',
  }
  return labels[position]
}
