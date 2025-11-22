/**
 * Compute Profile Identity (TIER 1 ONLY)
 *
 * Calculates FZTH identity: level, score, role, playstyle
 */

import type { PlayerProfileIdentity } from './types'
import type { PlayerPerformanceProfile } from '@/types/playerPerformance'
import { calculateFzthLevel, safeNumber } from './utils'

/**
 * Compute profile identity from performance data
 */
export function computeProfileIdentity(
  playerId: number,
  performanceProfile: PlayerPerformanceProfile | null,
  accountName?: string | null,
): PlayerProfileIdentity {
  // Calculate FZTH Score from performance indices
  // Formula: 40% performance, 30% consistency, 30% macro
  let fzthScore = 50 // Default conservative score

  if (performanceProfile) {
    const perf = performanceProfile.indices
    const performanceAvg =
      (safeNumber(perf.aggressiveness, 50) +
        safeNumber(perf.farmEfficiency, 50)) /
      2
    const consistency = safeNumber(perf.consistency, 50)
    const macro = safeNumber(perf.macroGameplay, 50)

    fzthScore = Math.round(
      performanceAvg * 0.4 + consistency * 0.3 + macro * 0.3,
    )
  }

  // Calculate level and progress
  const { level, nextLevelScore, progressToNext } =
    calculateFzthLevel(fzthScore)

  // Determine main role from performance data
  // This is a placeholder - real implementation would use hero pool data
  let mainRole: string | null = null
  if (performanceProfile) {
    // Placeholder: would need hero pool analysis
    mainRole = null
  }

  // Determine playstyle from performance indices
  let mainPlaystyle: string | null = null
  if (performanceProfile) {
    const perf = performanceProfile.indices
    const agg = safeNumber(perf.aggressiveness, 50)
    const farm = safeNumber(perf.farmEfficiency, 50)
    const macro = safeNumber(perf.macroGameplay, 50)

    if (agg >= 70 && farm >= 60) {
      mainPlaystyle = 'Aggressivo'
    } else if (farm >= 70 && macro >= 60) {
      mainPlaystyle = 'Macro oriented'
    } else if (agg >= 60 && macro >= 60) {
      mainPlaystyle = 'Equilibrato'
    } else {
      mainPlaystyle = 'In sviluppo'
    }
  }

  return {
    playerId,
    accountName: accountName ?? null,
    fzthLevel: level,
    fzthScore,
    nextLevelScore,
    progressToNext,
    mainRole,
    mainPlaystyle,
  }
}
