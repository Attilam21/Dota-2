/**
 * Combat & Teamfights Analysis (TIER 1 ONLY)
 *
 * Calculates combat metrics and teamfight participation
 */

import type { CombatAnalysis } from '@/types/matchAnalysis'
import type { MatchDetail } from '@/services/dota/opendotaAdapter'

/**
 * Calculate combat analysis from match detail
 */
export function calculateCombatAnalysis(
  matchDetail: MatchDetail,
): CombatAnalysis {
  const kills = matchDetail.player.kills
  const assists = matchDetail.player.assists
  const heroDamage = matchDetail.player.heroDamage ?? null

  // Calculate kill participation if we have team kills
  // For now, we estimate based on player's contribution
  // Real calculation would require team total kills
  let killParticipation: number | null = null
  // Placeholder: would need team total kills from match data
  // For now, set as null if we can't calculate

  // Hero damage percentage vs team average
  // Would require team average damage - placeholder for now
  let heroDamagePercent: number | null = null

  // Teamfight participation
  // Would require fight detection logic - placeholder for now
  let teamfightsParticipated: number | null = null
  let teamfightsTotal: number | null = null

  const insight = getCombatInsight({
    status: 'available',
    killParticipation,
    heroDamage,
    heroDamagePercent,
    damageTaken: null, // Not available from OpenDota
    teamfightsParticipated,
    teamfightsTotal,
  })

  return {
    status: 'available',
    killParticipation,
    heroDamage,
    heroDamagePercent,
    damageTaken: null,
    teamfightsParticipated,
    teamfightsTotal,
    insight,
  }
}

/**
 * Generate insight text for combat
 */
function getCombatInsight(
  data: Omit<CombatAnalysis, 'insight'>,
): string | null {
  if (data.status === 'unavailable') {
    return null
  }

  const { killParticipation, heroDamage, heroDamagePercent } = data

  // High participation but low damage
  if (
    killParticipation !== null &&
    killParticipation >= 60 &&
    heroDamagePercent !== null &&
    heroDamagePercent < 80
  ) {
    return 'Buona presenza nei teamfight ma output di danno sotto la media del team.'
  }

  // High damage output
  if (heroDamage !== null && heroDamage >= 20000) {
    return 'Alto impatto nei fight chiave: costruisci il gameplan attorno a queste finestre.'
  }

  // Low participation
  if (killParticipation !== null && killParticipation < 40) {
    return 'Bassa partecipazione ai fight: valuta di essere più presente nei momenti chiave.'
  }

  return "Analizza la partecipazione ai fight per massimizzare l'impatto di squadra."
}
