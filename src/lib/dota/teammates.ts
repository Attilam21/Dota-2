/**
 * Teammates Calculator (TIER 1 ONLY)
 *
 * Calculates teammates profile using ONLY real data from OpenDota peers endpoint.
 * All aggregations must be based on actual match data (wins, losses, matches_together).
 */

import type {
  TeammateAggregated,
  TeammatesProfile,
  TeammatesSummary,
} from '@/types/teammates'
import type { PeersKPI } from '@/services/dota/kpiService'

/**
 * Minimum matches required to consider a teammate (configurable constant)
 */
export const MIN_MATCHES_FOR_TEAMMATE = 5

/**
 * Utility: safely calculate winrate
 */
function calculateWinrate(wins: number, losses: number): number {
  const total = wins + losses
  if (total === 0) return 0
  return Number(((wins / total) * 100).toFixed(1))
}

/**
 * Build teammates profile from PeersKPI data
 *
 * @param peersKPI PeersKPI data from OpenDota
 * @returns TeammatesProfile with aggregated stats
 */
export function buildTeammatesProfile(peersKPI: PeersKPI): TeammatesProfile {
  if (!peersKPI || !peersKPI.peers || peersKPI.peers.length === 0) {
    return {
      summary: {
        totalTeammates: 0,
        positiveWinrate: 0,
        negativeWinrate: 0,
        bestTeammate: null,
      },
      teammates: [],
    }
  }

  // Convert PeersKPI peers to TeammateAggregated
  const teammates: TeammateAggregated[] = peersKPI.peers
    .filter((p) => {
      // Filter out invalid data
      return (
        p.accountId != null &&
        p.matchesTogether > 0 &&
        p.wins != null &&
        p.losses != null
      )
    })
    .map((p) => {
      const winrate = calculateWinrate(p.wins, p.losses)
      return {
        accountId: p.accountId,
        displayName: null, // Future: will come from Steam API
        avatarUrl: null, // Future: will come from Steam API
        matches: p.matchesTogether,
        wins: p.wins,
        losses: p.losses,
        winrate,
      }
    })

  // Sort by matches descending (default)
  teammates.sort((a, b) => b.matches - a.matches)

  // Build summary
  const totalTeammates = teammates.length
  const positiveWinrate = teammates.filter((t) => t.winrate >= 50).length
  const negativeWinrate = teammates.filter((t) => t.winrate < 50).length

  // Find best teammate (highest winrate with matches >= minMatches)
  const eligible = teammates.filter(
    (t) => t.matches >= MIN_MATCHES_FOR_TEAMMATE,
  )
  const bestTeammate =
    eligible.length > 0
      ? eligible.reduce((best, current) =>
          current.winrate > best.winrate ? current : best,
        )
      : null

  return {
    summary: {
      totalTeammates,
      positiveWinrate,
      negativeWinrate,
      bestTeammate,
    },
    teammates,
  }
}

/**
 * Get display name for teammate (displayName or accountId as fallback)
 */
export function getTeammateDisplayName(teammate: TeammateAggregated): string {
  return teammate.displayName ?? teammate.accountId.toString()
}
