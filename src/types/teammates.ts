/**
 * Teammates Types (TIER 1 ONLY)
 *
 * Types for enterprise teammates analysis using ONLY real data
 * from OpenDota peers endpoint.
 */

/**
 * Teammate Raw Data (from API)
 */
export type TeammateRaw = {
  account_id: number
  matches_together: number
  wins: number
  losses: number
  // Optional fields for future Steam integration
  display_name?: string | null
  avatar_url?: string | null
}

/**
 * Teammate Aggregated (processed for UI)
 */
export interface TeammateAggregated {
  accountId: number
  displayName?: string | null // Optional, for future Steam integration
  avatarUrl?: string | null // Optional, for future Steam integration
  matches: number
  wins: number
  losses: number
  winrate: number // 0-100, rounded to 1 decimal
}

/**
 * Teammates Summary (KPI cards)
 */
export interface TeammatesSummary {
  totalTeammates: number
  positiveWinrate: number // count of teammates with winrate >= 50
  negativeWinrate: number // count of teammates with winrate < 50
  bestTeammate: TeammateAggregated | null // highest winrate with matches >= minMatches
}

/**
 * Teammates Profile (complete data structure)
 */
export interface TeammatesProfile {
  summary: TeammatesSummary
  teammates: TeammateAggregated[]
}
