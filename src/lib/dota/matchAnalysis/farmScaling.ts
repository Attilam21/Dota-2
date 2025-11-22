/**
 * Farm & Scaling Analysis (TIER 1 ONLY)
 *
 * Calculates farm scaling metrics and recovery score
 */

import type { FarmScalingAnalysis } from '@/types/matchAnalysis'
import type { MatchDetail } from '@/services/dota/opendotaAdapter'

/**
 * Calculate farm scaling analysis from match detail
 * Note: GPM/XPM timeline requires per-minute data which may not be available
 */
export function calculateFarmScalingAnalysis(
  matchDetail: MatchDetail,
): FarmScalingAnalysis {
  const gpm = matchDetail.player.gpm ?? null
  const xpm = matchDetail.player.xpm ?? null
  const durationMinutes = matchDetail.match.durationSeconds / 60

  // For now, we don't have per-minute GPM/XPM timeline from OpenDota
  // This would require gold_t or xp_t timeline data
  // Calculate recovery score based on available data
  let recoveryScore: number | null = null
  let recoveryLabel: 'Basso' | 'Medio' | 'Alto' | null = null

  // Simplified recovery calculation: if GPM is good relative to duration
  // This is a placeholder until we have timeline data
  if (gpm !== null && durationMinutes > 0) {
    // Simple heuristic: GPM > 400 = good recovery potential
    // This is a simplified version - real calculation needs timeline
    if (gpm >= 450) {
      recoveryScore = 75
      recoveryLabel = 'Alto'
    } else if (gpm >= 350) {
      recoveryScore = 50
      recoveryLabel = 'Medio'
    } else {
      recoveryScore = 25
      recoveryLabel = 'Basso'
    }
  }

  const insight = getFarmScalingInsight({
    status: 'available',
    gpmTimeline: null,
    xpmTimeline: null,
    midGameGpmAvg: null,
    lateGameGpmAvg: null,
    recoveryScore,
    recoveryLabel,
  })

  return {
    status: 'available',
    gpmTimeline: null, // Would require timeline data
    xpmTimeline: null, // Would require timeline data
    midGameGpmAvg: null,
    lateGameGpmAvg: null,
    recoveryScore,
    recoveryLabel,
    insight,
  }
}

/**
 * Generate insight text for farm scaling
 */
function getFarmScalingInsight(
  data: Omit<FarmScalingAnalysis, 'insight'>,
): string | null {
  if (data.status === 'unavailable') {
    return null
  }

  if (data.recoveryScore !== null && data.recoveryLabel !== null) {
    if (data.recoveryLabel === 'Alto' && data.midGameGpmAvg !== null) {
      return 'Ottima capacità di recupero mid/late nonostante un early debole.'
    }

    if (data.recoveryLabel === 'Medio') {
      return 'Farm stabile ma mai esplosivo: valuta finestre di power spike migliori.'
    }

    if (data.recoveryLabel === 'Basso') {
      return 'Farm insufficiente: lavora su last hit, farm pattern e gestione risorse.'
    }
  }

  return 'Analizza la timeline GPM/XPM per identificare finestre di miglioramento.'
}
