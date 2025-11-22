/**
 * Objectives Analysis (TIER 1 ONLY)
 *
 * Calculates objective participation metrics
 */

import type { ObjectivesAnalysis } from '@/types/matchAnalysis'
import type { MatchDetail } from '@/services/dota/opendotaAdapter'

/**
 * Calculate objectives analysis from match detail
 */
export function calculateObjectivesAnalysis(
  matchDetail: MatchDetail,
): ObjectivesAnalysis {
  const towerDamage = matchDetail.player.towerDamage ?? null

  // Tower participation would require team total tower damage
  // For now, we can only show player's tower damage
  let towerParticipation: number | null = null

  // Roshan participation would require Roshan kill events
  // Not available from OpenDota match detail - placeholder
  let roshanParticipation: number | null = null

  const insight = getObjectivesInsight({
    status: 'available',
    towerParticipation,
    roshanParticipation,
    towerDamage,
  })

  return {
    status: 'available',
    towerParticipation,
    roshanParticipation,
    towerDamage,
    insight,
  }
}

/**
 * Generate insight text for objectives
 */
function getObjectivesInsight(
  data: Omit<ObjectivesAnalysis, 'insight'>,
): string | null {
  if (data.status === 'unavailable') {
    return null
  }

  const { towerParticipation, towerDamage } = data

  // Low tower participation
  if (
    towerParticipation !== null &&
    towerParticipation < 30 &&
    towerDamage !== null &&
    towerDamage < 1000
  ) {
    return 'Buon micro ma bassa partecipazione agli obiettivi: rischi di non convertire i vantaggi.'
  }

  // High tower damage
  if (towerDamage !== null && towerDamage >= 5000) {
    return 'Alta partecipazione agli obiettivi chiave: ottima gestione macro.'
  }

  return 'Focus sugli obiettivi per convertire i vantaggi in vittoria.'
}
