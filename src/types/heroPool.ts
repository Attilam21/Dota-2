/**
 * Hero Pool Types (TIER 1 ONLY)
 *
 * Types for enterprise hero pool analysis using ONLY real data
 * from matches_digest and OpenDota.
 */

/**
 * Hero Performance Row (one row in the table)
 */
export interface HeroPerformanceRow {
  heroId: number
  heroName: string
  matches: number
  winrate: number // 0-100
  kda: number | null
  gpm: number | null
  xpm: number | null
  avgDurationMinutes: number | null
  primaryRole: string | null
  primaryLane: string | null
}

/**
 * Hero Pool Summary (KPI cards at top)
 */
export interface HeroPoolSummary {
  heroPoolCount: number
  mostPlayedHero: HeroPerformanceRow | null
  bestHero: HeroPerformanceRow | null // with matches >= 3
  worstHero: HeroPerformanceRow | null // with matches >= 3
}

/**
 * Hero Pool Profile (complete data structure)
 */
export interface HeroPoolProfile {
  summary: HeroPoolSummary
  heroes: HeroPerformanceRow[]
}
