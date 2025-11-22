/**
 * Compute Objectives Analysis (TIER 1 ONLY)
 *
 * Calculates objective participation metrics
 */

import type { MatchDetail } from '@/services/dota/opendotaAdapter'
import { safeNumber, percentage } from './utils'

export interface ObjectivesAnalysisData {
  objectiveImpactScore: number | null // 0-100
  towerDamage: number | null
  towerDamagePercent: number | null // vs estimated team average
  roshanParticipation: number | null // 0-100, placeholder
  runePickups: number | null // placeholder
  observerPlacement: number | null // placeholder
  insights: string[]
}

/**
 * Compute objectives analysis
 */
export function computeObjectives(
  matchDetail: MatchDetail,
): ObjectivesAnalysisData {
  const player = matchDetail.player
  const towerDamage = player.towerDamage ?? null

  // Estimate tower damage percent vs team average
  let towerDamagePercent: number | null = null
  if (towerDamage !== null) {
    // Rough estimation: assume team average around 3000-5000
    const estimatedTeamAvg = 4000
    towerDamagePercent = percentage(towerDamage, estimatedTeamAvg)
  }

  // Objective Impact Score: based on tower damage and other factors
  let objectiveImpactScore: number | null = null
  if (towerDamage !== null) {
    // Tower damage score (0-100)
    const towerScore = Math.min(100, percentage(towerDamage, 10000)) // 10k = excellent
    objectiveImpactScore = Math.round(towerScore)
  }

  const insights: string[] = []

  if (towerDamagePercent !== null) {
    if (towerDamagePercent < 50) {
      insights.push(
        'Partecipazione agli obiettivi bassa: concentrati di più su torri e strutture. Macro game da migliorare.',
      )
    } else if (towerDamagePercent >= 80) {
      insights.push(
        'Alto impatto sugli obiettivi: ottima partecipazione alle strutture. Mantieni questo focus.',
      )
    }
  }

  if (objectiveImpactScore !== null && objectiveImpactScore < 30) {
    insights.push(
      'Impatto obiettivi basso: valuta rotazioni e timing per partecipare meglio alle strutture.',
    )
  }

  return {
    objectiveImpactScore,
    towerDamage,
    towerDamagePercent,
    roshanParticipation: null, // Requires Roshan kill events
    runePickups: null, // Requires rune log
    observerPlacement: null, // Requires ward log
    insights,
  }
}
