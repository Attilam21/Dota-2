/**
 * Compute Laning Efficiency Analysis (TIER 1 ONLY)
 *
 * Calculates laning phase metrics (0-10 minutes)
 */

import type { MatchDetail } from '@/services/dota/opendotaAdapter'
import { getAdvancedAnalysis } from '@/lib/dota/matchAnalysis/getAdvancedAnalysis'
import { safeNumber } from './utils'

export interface LaningEfficiencyAnalysisData {
  status: 'available' | 'unavailable'
  csAt10: number | null
  deniesAt10: number | null
  xpAt10: number | null // Calculated from xpm if available
  laneOutcome: 'Win' | 'Lose' | 'Draw' | null
  efficiency: number | null // 0-100
  insights: string[]
}

/**
 * Compute laning efficiency analysis
 * Note: CS@10 and denies@10 require timeline data which may not be available
 */
export async function computeLaningEfficiency(
  matchDetail: MatchDetail,
): Promise<LaningEfficiencyAnalysisData> {
  const player = matchDetail.player
  const lastHits = player.lastHits ?? null
  const denies = player.denies ?? null
  const durationMinutes = matchDetail.match.durationSeconds / 60

  // Estimate CS@10 from total last hits and duration
  // This is a rough estimate - real CS@10 would require timeline data
  let csAt10: number | null = null
  if (lastHits !== null && durationMinutes > 0) {
    // Estimate: assume average CS rate, adjust for early game
    const avgCSPerMin = lastHits / durationMinutes
    csAt10 = Math.round(avgCSPerMin * 10)
  }

  // Estimate denies@10 similarly
  let deniesAt10: number | null = null
  if (denies !== null && durationMinutes > 0) {
    const avgDeniesPerMin = denies / durationMinutes
    deniesAt10 = Math.round(avgDeniesPerMin * 10)
  }

  // Estimate XP@10 from XPM
  let xpAt10: number | null = null
  const xpm = player.xpm ?? null
  if (xpm !== null && xpm > 0) {
    xpAt10 = Math.round(xpm * 10)
  }

  // Lane outcome: rough estimation based on early CS/denies
  let laneOutcome: 'Win' | 'Lose' | 'Draw' | null = null
  if (csAt10 !== null) {
    if (csAt10 >= 50) {
      laneOutcome = 'Win'
    } else if (csAt10 >= 35) {
      laneOutcome = 'Draw'
    } else {
      laneOutcome = 'Lose'
    }
  }

  // Efficiency: combination of CS and denies
  let efficiency: number | null = null
  if (csAt10 !== null) {
    // Normalize CS@10 (0-100 scale, assuming 60+ is excellent)
    efficiency = Math.min(100, Math.round((csAt10 / 60) * 100))
    if (deniesAt10 !== null && deniesAt10 > 0) {
      // Bonus for denies
      efficiency = Math.min(100, efficiency + deniesAt10 * 2)
    }
  }

  const insights: string[] = []
  if (laneOutcome === 'Win') {
    insights.push(
      'Lane vinta: buon controllo CS e denies. Valuta push/rotate per estendere il vantaggio.',
    )
  } else if (laneOutcome === 'Lose') {
    insights.push(
      'Lane persa: CS basso. Lavora su last hit, wave control e adatta build/posizionamento.',
    )
  } else if (laneOutcome === 'Draw') {
    insights.push(
      'Lane pari: CS nella media. Migliora leggermente CS e denies per ottenere vantaggio.',
    )
  }

  if (efficiency !== null) {
    if (efficiency < 50) {
      insights.push(
        'Efficienza laning bassa: concentrati sul farm e sul controllo wave.',
      )
    } else if (efficiency >= 80) {
      insights.push(
        'Efficienza laning eccellente: mantieni questo livello di controllo.',
      )
    }
  }

  return {
    status: 'available',
    csAt10,
    deniesAt10,
    xpAt10,
    laneOutcome,
    efficiency,
    insights,
  }
}
