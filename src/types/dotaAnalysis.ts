/**
 * Dota 2 Player Match Analysis Types (TIER 1 ONLY)
 *
 * Types for Dota 2 player match analysis using ONLY Tier 1 data guaranteed by OpenDota API.
 * Removed all Tier 2/3 fields (death analysis, heatmap, etc.) that depend on non-guaranteed data.
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
 * Kill/death distribution by game phase (TIER 1 - uses kills_log guaranteed by OpenDota)
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
 * Percentage distribution by game phase (TIER 1 - calculated from PhaseDistribution)
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
 * Complete player match analysis for Dota 2 (TIER 1 ONLY)
 * Contains only data guaranteed by OpenDota API
 * Maps to dota_player_match_analysis table in Supabase (only Tier 1 columns used)
 */
export interface DotaPlayerMatchAnalysis {
  /** OpenDota match ID */
  matchId: number
  /** Dota 2 account ID (Steam32) */
  accountId: number
  /** Role position played (1-5) - calculated from OpenDota players[].role */
  rolePosition: RolePosition
  /** Kill distribution by game phase (TIER 1 - from kills_log guaranteed by OpenDota) */
  killDistribution: PhaseDistribution
  /** Kill percentage distribution by game phase (TIER 1 - calculated from killDistribution) */
  killPercentageDistribution: PhasePercentageDistribution
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
