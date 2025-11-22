/**
 * Compute Farm & Scaling Analysis (TIER 1 ONLY)
 *
 * Calculates farm scaling metrics and recovery score
 */

import type { MatchDetail } from '@/services/dota/opendotaAdapter'
import { safeNumber } from './utils'

export interface FarmScalingAnalysisData {
  recoveryIndex: number | null // 0-100
  recoveryLabel: 'Basso' | 'Medio' | 'Alto' | null
  farmSpikes: Array<{ minute: number; type: 'positive' | 'negative' }> | null
  scalingMidLate: 'Basso' | 'Medio' | 'Alto' | null
  insights: string[]
}

/**
 * Compute farm scaling analysis
 */
export function computeFarmScaling(
  matchDetail: MatchDetail,
): FarmScalingAnalysisData {
  const player = matchDetail.player
  const gpm = player.gpm ?? null
  const xpm = player.xpm ?? null
  const durationMinutes = matchDetail.match.durationSeconds / 60

  // Recovery Index: based on GPM relative to duration
  let recoveryIndex: number | null = null
  let recoveryLabel: 'Basso' | 'Medio' | 'Alto' | null = null
  if (gpm !== null) {
    // Simplified recovery: if GPM is good relative to duration, recovery is high
    // Longer games with good GPM = better recovery
    if (gpm >= 450 && durationMinutes >= 30) {
      recoveryIndex = 80
      recoveryLabel = 'Alto'
    } else if (gpm >= 400 && durationMinutes >= 25) {
      recoveryIndex = 60
      recoveryLabel = 'Medio'
    } else if (gpm >= 350) {
      recoveryIndex = 40
      recoveryLabel = 'Medio'
    } else {
      recoveryIndex = 20
      recoveryLabel = 'Basso'
    }
  }

  // Farm spikes: placeholder for now (would require timeline data)
  const farmSpikes: Array<{
    minute: number
    type: 'positive' | 'negative'
  }> | null = null

  // Scaling mid/late: based on XPM and duration
  let scalingMidLate: 'Basso' | 'Medio' | 'Alto' | null = null
  if (xpm !== null && durationMinutes >= 25) {
    if (xpm >= 550) {
      scalingMidLate = 'Alto'
    } else if (xpm >= 450) {
      scalingMidLate = 'Medio'
    } else {
      scalingMidLate = 'Basso'
    }
  }

  const insights: string[] = []

  if (recoveryLabel === 'Basso') {
    insights.push(
      'Recovery basso: farm insufficiente nelle fasi avanzate. Migliora la gestione della mappa e il farm pattern.',
    )
  } else if (recoveryLabel === 'Alto') {
    insights.push(
      'Ottimo recovery: hai saputo recuperare farm nelle fasi avanzate. Mantieni questo approccio.',
    )
  }

  if (scalingMidLate === 'Basso' && durationMinutes >= 30) {
    insights.push(
      'Scaling mid/late basso: XP insufficiente nelle fasi avanzate. Valuta rotazioni e partecipazione ai fight.',
    )
  }

  if (gpm !== null && gpm < 350 && durationMinutes >= 30) {
    insights.push(
      'Farm stabile ma basso: potresti aver perso finestre di farm. Valuta il timing dei fight e del farm.',
    )
  }

  return {
    recoveryIndex,
    recoveryLabel,
    farmSpikes,
    scalingMidLate,
    insights,
  }
}
