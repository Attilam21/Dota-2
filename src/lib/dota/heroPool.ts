/**
 * Hero Pool Calculator (TIER 1 ONLY)
 *
 * Calculates hero pool profile using ONLY real data from matches.
 * All aggregations must be based on actual match data (kills, deaths, assists, duration, GPM/XPM if available).
 */

import type {
  HeroPoolProfile,
  HeroPerformanceRow,
  HeroPoolSummary,
} from '@/types/heroPool'
import { getHeroName } from '@/lib/dotaHeroes'
import type { MatchRow } from '@/services/dota/opendotaAdapter'

/**
 * Utility: safely convert value to number (fallback to null)
 */
function safeNumber(value: unknown): number | null {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value
  }
  return null
}

/**
 * Utility: calculate KDA
 */
function calculateKDA(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists
  return (kills + assists) / deaths
}

/**
 * Build hero pool profile from match data
 *
 * @param matches Array of matches with hero data
 * @returns HeroPoolProfile with aggregated stats
 */
export function buildHeroPoolProfile(matches: MatchRow[]): HeroPoolProfile {
  if (!matches || matches.length === 0) {
    return {
      summary: {
        heroPoolCount: 0,
        mostPlayedHero: null,
        bestHero: null,
        worstHero: null,
      },
      heroes: [],
    }
  }

  // Aggregate by hero
  const heroMap = new Map<
    number,
    {
      matches: number
      wins: number
      sumKills: number
      sumDeaths: number
      sumAssists: number
      sumDuration: number
      sumGpm: number
      gpmCount: number // track how many matches have GPM
      sumXpm: number
      xpmCount: number // track how many matches have XPM
      roles: Map<string, number> // role -> count
      lanes: Map<string, number> // lane -> count
    }
  >()

  for (const match of matches) {
    const heroId = match.hero_id
    const existing = heroMap.get(heroId) || {
      matches: 0,
      wins: 0,
      sumKills: 0,
      sumDeaths: 0,
      sumAssists: 0,
      sumDuration: 0,
      sumGpm: 0,
      gpmCount: 0,
      sumXpm: 0,
      xpmCount: 0,
      roles: new Map<string, number>(),
      lanes: new Map<string, number>(),
    }

    existing.matches++
    if (match.result === 'win') existing.wins++

    existing.sumKills += safeNumber(match.kills) ?? 0
    existing.sumDeaths += safeNumber(match.deaths) ?? 0
    existing.sumAssists += safeNumber(match.assists) ?? 0
    existing.sumDuration += safeNumber(match.duration_seconds) ?? 0

    // GPM/XPM are optional (may not be available in all matches)
    // Note: MatchRow doesn't include GPM/XPM by default, these would come from match details
    // For now, we'll track them as null if not available
    // TODO: If needed, fetch match details to get GPM/XPM for each match
    const gpm = null // GPM not available in MatchRow base data
    if (gpm !== null) {
      existing.sumGpm += gpm
      existing.gpmCount++
    }

    const xpm = null // XPM not available in MatchRow base data
    if (xpm !== null) {
      existing.sumXpm += xpm
      existing.xpmCount++
    }

    // Track role/lane
    if (match.role) {
      const roleCount = existing.roles.get(match.role) || 0
      existing.roles.set(match.role, roleCount + 1)
    }
    if (match.lane) {
      const laneCount = existing.lanes.get(match.lane) || 0
      existing.lanes.set(match.lane, laneCount + 1)
    }

    heroMap.set(heroId, existing)
  }

  // Convert to HeroPerformanceRow[]
  const heroes: HeroPerformanceRow[] = Array.from(heroMap.entries()).map(
    ([heroId, stats]) => {
      const winrate = stats.matches > 0 ? (stats.wins / stats.matches) * 100 : 0

      // Calculate average KDA
      const avgKills = stats.sumKills / stats.matches
      const avgDeaths = stats.sumDeaths / stats.matches
      const avgAssists = stats.sumAssists / stats.matches
      const kda = calculateKDA(avgKills, avgDeaths, avgAssists)

      // Calculate average GPM/XPM (only if we have data)
      const gpm = stats.gpmCount > 0 ? stats.sumGpm / stats.gpmCount : null
      const xpm = stats.xpmCount > 0 ? stats.sumXpm / stats.xpmCount : null

      // Calculate average duration
      const avgDurationMinutes =
        stats.matches > 0
          ? Math.round(stats.sumDuration / stats.matches / 60)
          : null

      // Find most common role/lane
      let primaryRole: string | null = null
      let maxRoleCount = 0
      Array.from(stats.roles.entries()).forEach(([role, count]) => {
        if (count > maxRoleCount) {
          maxRoleCount = count
          primaryRole = role
        }
      })

      let primaryLane: string | null = null
      let maxLaneCount = 0
      Array.from(stats.lanes.entries()).forEach(([lane, count]) => {
        if (count > maxLaneCount) {
          maxLaneCount = count
          primaryLane = lane
        }
      })

      return {
        heroId,
        heroName: getHeroName(heroId),
        matches: stats.matches,
        winrate: Number(winrate.toFixed(1)),
        kda: Number(kda.toFixed(2)),
        gpm: gpm !== null ? Math.round(gpm) : null,
        xpm: xpm !== null ? Math.round(xpm) : null,
        avgDurationMinutes,
        primaryRole,
        primaryLane,
      }
    },
  )

  // Sort by matches descending (default)
  heroes.sort((a, b) => b.matches - a.matches)

  // Build summary
  const mostPlayedHero: HeroPerformanceRow | null = heroes[0] ?? null

  // Filter heroes with >= 3 matches for best/worst
  const eligible = heroes.filter((h) => h.matches >= 3)

  let bestHero: HeroPerformanceRow | null = null
  let worstHero: HeroPerformanceRow | null = null

  if (eligible.length > 0) {
    const sortedByWinrate = [...eligible].sort((a, b) => b.winrate - a.winrate)
    bestHero = sortedByWinrate[0] ?? null
    worstHero = sortedByWinrate[sortedByWinrate.length - 1] ?? null
  }

  return {
    summary: {
      heroPoolCount: heroes.length,
      mostPlayedHero,
      bestHero,
      worstHero,
    },
    heroes,
  }
}
