/**
 * Compute Overview Analysis (TIER 1 ONLY)
 *
 * Calculates overview metrics from match detail
 */

import type { MatchDetail } from '@/services/dota/opendotaAdapter'
import { safeNumber } from './utils'

export interface OverviewAnalysisData {
  kda: string // "K/D/A" format
  kdaRatio: number
  gpm: number | null
  xpm: number | null
  lastHits: number | null
  denies: number | null
  goldWasted: number | null // Not directly available, null for now
  heroDamage: number | null
  heroHealing: number | null
}

/**
 * Compute overview analysis from match detail
 */
export function computeOverview(
  matchDetail: MatchDetail,
): OverviewAnalysisData {
  const player = matchDetail.player
  const kills = player.kills
  const deaths = player.deaths
  const assists = player.assists
  const kdaRatio = player.kda

  return {
    kda: `${kills}/${deaths}/${assists}`,
    kdaRatio,
    gpm: player.gpm ?? null,
    xpm: player.xpm ?? null,
    lastHits: player.lastHits ?? null,
    denies: player.denies ?? null,
    goldWasted: null, // Not available from Tier 1 data
    heroDamage: player.heroDamage ?? null,
    heroHealing: player.heroHealing ?? null,
  }
}
