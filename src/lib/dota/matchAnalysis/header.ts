/**
 * Match Header Analysis (TIER 1 ONLY)
 *
 * Calculates match header data from Tier 1 sources
 */

import type { MatchHeader } from '@/types/matchAnalysis'
import type { MatchDetail } from '@/services/dota/opendotaAdapter'
import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'
import { getHeroName } from '@/lib/dotaHeroes'
import { getRolePositionLabel } from '@/types/dotaAnalysis'

/**
 * Calculate match header from match detail and analysis data
 */
export function calculateMatchHeader(
  matchDetail: MatchDetail,
  analysis: DotaPlayerMatchAnalysis | null,
): MatchHeader {
  const isRadiant = matchDetail.player.accountId
    ? matchDetail.match.radiantWin
    : false
  // Determine result based on player team
  const playerSlot = matchDetail.player.accountId
  const isPlayerRadiant = playerSlot !== undefined && playerSlot < 128
  const result: 'win' | 'lose' =
    isPlayerRadiant === matchDetail.match.radiantWin ? 'win' : 'lose'

  const rolePosition = analysis?.rolePosition ?? null
  const roleLabel = rolePosition ? getRolePositionLabel(rolePosition) : null

  return {
    matchId: matchDetail.match.matchId,
    heroId: matchDetail.player.heroId,
    heroName: getHeroName(matchDetail.player.heroId),
    rolePosition,
    roleLabel,
    result,
    kills: matchDetail.player.kills,
    deaths: matchDetail.player.deaths,
    assists: matchDetail.player.assists,
    kda: matchDetail.player.kda,
    gpm: matchDetail.player.gpm ?? null,
    xpm: matchDetail.player.xpm ?? null,
    lastHits: matchDetail.player.lastHits ?? null,
    denies: matchDetail.player.denies ?? null,
    durationSeconds: matchDetail.match.durationSeconds,
    startTime: matchDetail.match.startTime,
  }
}
