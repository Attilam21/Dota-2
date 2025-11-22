/**
 * Compute Profile Pillars (TIER 1 ONLY)
 *
 * Calculates 5 pillars: Laning/Farm, Macro, Teamfight, Consistency, Hero Pool
 */

import type { ProfilePillar } from './types'
import type { PlayerPerformanceProfile } from '@/types/playerPerformance'
import type { FightProfileScores } from '@/types/playerPerformance'
import { calculateTrend, generatePillarInsight, safeNumber } from './utils'

/**
 * Compute pillars from performance and fight profile data
 */
export function computePillars(
  performanceProfile: PlayerPerformanceProfile | null,
  fightProfile: FightProfileScores | null,
  previousPeriodProfile: PlayerPerformanceProfile | null = null,
): ProfilePillar[] {
  const perf = performanceProfile?.indices
  const prevPerf = previousPeriodProfile?.indices

  // 1. Laning/Farm Pillar
  const laningScore = safeNumber(perf?.farmEfficiency, 50)
  const prevLaningScore = safeNumber(prevPerf?.farmEfficiency, laningScore)
  const laningTrend = calculateTrend(laningScore, prevLaningScore)

  // 2. Macro Pillar
  const macroScore = safeNumber(perf?.macroGameplay, 50)
  const prevMacroScore = safeNumber(prevPerf?.macroGameplay, macroScore)
  const macroTrend = calculateTrend(macroScore, prevMacroScore)

  // 3. Teamfight Pillar (from fight profile)
  let teamfightScore = 50
  if (
    fightProfile &&
    fightProfile.impactScore !== null &&
    fightProfile.impactScore !== undefined
  ) {
    teamfightScore = safeNumber(fightProfile.impactScore, 50)
  } else if (perf) {
    // Fallback: use aggressiveness as proxy
    teamfightScore = safeNumber(perf.aggressiveness, 50)
  }
  const prevTeamfightScore = teamfightScore // Placeholder
  const teamfightTrend = calculateTrend(teamfightScore, prevTeamfightScore)

  // 4. Consistency Pillar
  const consistencyScore = safeNumber(perf?.consistency, 50)
  const prevConsistencyScore = safeNumber(
    prevPerf?.consistency,
    consistencyScore,
  )
  const consistencyTrend = calculateTrend(
    consistencyScore,
    prevConsistencyScore,
  )

  // 5. Hero Pool Pillar (placeholder - would need hero pool analysis)
  const heroPoolScore = 50 // Placeholder
  const heroPoolTrend: 'up' | 'flat' | 'down' = 'flat'

  return [
    {
      id: 'laning',
      label: 'Laning & Farm',
      description: 'Efficienza nella fase early e gestione risorse',
      score: Math.round(laningScore),
      trend: laningTrend,
      insight: generatePillarInsight('laning', laningScore, laningTrend),
    },
    {
      id: 'macro',
      label: 'Macro & Objectives',
      description: 'Impatto su obiettivi e gestione mid/late game',
      score: Math.round(macroScore),
      trend: macroTrend,
      insight: generatePillarInsight('macro', macroScore, macroTrend),
    },
    {
      id: 'teamfight',
      label: 'Teamfight',
      description: 'Presenza e impatto nei combattimenti di squadra',
      score: Math.round(teamfightScore),
      trend: teamfightTrend,
      insight: generatePillarInsight(
        'teamfight',
        teamfightScore,
        teamfightTrend,
      ),
    },
    {
      id: 'consistency',
      label: 'Consistenza',
      description: 'Stabilità delle prestazioni partita per partita',
      score: Math.round(consistencyScore),
      trend: consistencyTrend,
      insight: generatePillarInsight(
        'consistency',
        consistencyScore,
        consistencyTrend,
      ),
    },
    {
      id: 'hero_pool',
      label: 'Hero Pool & Meta',
      description: 'Ampiezza pool eroi e aderenza al meta',
      score: heroPoolScore,
      trend: heroPoolTrend,
      insight: 'Hero pool analysis in sviluppo. Dati disponibili a breve.',
    },
  ]
}
