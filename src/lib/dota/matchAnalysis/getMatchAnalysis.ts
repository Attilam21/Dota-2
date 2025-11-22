/**
 * Match Analysis PRO - Main Data Loading Function (TIER 1 ONLY)
 *
 * Unifies data loading from multiple sources and calculates complete match analysis
 */

import type { MatchAnalysis } from '@/types/matchAnalysis'
import type { MatchDetail } from '@/services/dota/opendotaAdapter'
import { getMatchDetail } from '@/services/dota/opendotaAdapter'
import { getAdvancedAnalysis } from './getAdvancedAnalysis'
import { calculateMatchHeader } from './header'
import { calculateKillDistribution } from './killDistribution'
import { calculateLaningAnalysis } from './laning'
import { calculateFarmScalingAnalysis } from './farmScaling'
import { calculateBuildAnalysis } from './build'
import { calculateCombatAnalysis } from './combat'
import { calculateVisionAnalysis } from './vision'
import { calculateObjectivesAnalysis } from './objectives'
import { calculateActionsAnalysis } from './actions'

/**
 * Get complete match analysis for a player in a match
 *
 * @param matchId - OpenDota match ID
 * @param playerAccountId - Dota 2 account ID (Steam32)
 * @returns Complete MatchAnalysis with all blocks
 */
export async function getMatchAnalysis(
  matchId: number,
  playerAccountId: number,
): Promise<MatchAnalysis> {
  // 1. Fetch match detail from OpenDota
  const matchDetail: MatchDetail = await getMatchDetail(
    matchId,
    playerAccountId,
  )

  // 2. Fetch advanced analysis (kill distribution, role position)
  const advancedAnalysis = await getAdvancedAnalysis(matchId, playerAccountId)

  // 3. Calculate all analysis blocks
  const header = calculateMatchHeader(matchDetail, advancedAnalysis)
  const killDistribution = calculateKillDistribution(advancedAnalysis)
  const laning = calculateLaningAnalysis(matchDetail)
  const farmScaling = calculateFarmScalingAnalysis(matchDetail)
  const build = calculateBuildAnalysis()
  const combat = calculateCombatAnalysis(matchDetail)
  const vision = calculateVisionAnalysis()
  const objectives = calculateObjectivesAnalysis(matchDetail)
  const actions = calculateActionsAnalysis()

  return {
    header,
    killDistribution,
    laning,
    farmScaling,
    build,
    combat,
    vision,
    objectives,
    actions,
  }
}
