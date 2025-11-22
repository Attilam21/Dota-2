/**
 * Compute Combat Analysis (TIER 1 ONLY)
 *
 * Calculates combat metrics and fight impact
 */

import type { MatchDetail } from '@/services/dota/opendotaAdapter'
import { safeNumber, percentage } from './utils'

export interface CombatAnalysisData {
  heroDamage: number | null
  heroDamagePercent: number | null // vs team average (estimated)
  damageTaken: number | null
  fightImpactScore: number | null // 0-100
  deathClusters: number // Number of death clusters (deaths within 2 min)
  insights: string[]
}

/**
 * Compute combat analysis from match detail
 */
export function computeCombat(matchDetail: MatchDetail): CombatAnalysisData {
  const player = matchDetail.player
  const kills = player.kills
  const deaths = player.deaths
  const assists = player.assists
  const heroDamage = player.heroDamage ?? null

  // Estimate damage percent vs team average
  // For now, we use a simple heuristic: if damage > 20000, likely above average
  let heroDamagePercent: number | null = null
  if (heroDamage !== null) {
    // Rough estimation: assume team average around 15k-20k
    // This is a placeholder until we have team data
    const estimatedTeamAvg = 17500
    heroDamagePercent = percentage(heroDamage, estimatedTeamAvg)
  }

  // Fight Impact Score: combination of KDA, damage, and assists
  let fightImpactScore: number | null = null
  if (heroDamage !== null && deaths > 0) {
    const kdaRatio = (kills + assists) / Math.max(1, deaths)
    const damageScore = Math.min(100, percentage(heroDamage, 30000)) // 30k = excellent
    const kdaScore = Math.min(100, kdaRatio * 10) // KDA 10 = excellent
    fightImpactScore = Math.round(damageScore * 0.6 + kdaScore * 0.4)
  }

  // Death clusters: deaths within 2 minutes
  // For now, we estimate based on total deaths and duration
  // Real calculation would require death timestamps
  let deathClusters = 0
  if (deaths > 0) {
    const durationMinutes = matchDetail.match.durationSeconds / 60
    // Estimate: if many deaths in short duration, likely clustered
    if (deaths >= 8 && durationMinutes < 35) {
      deathClusters = Math.min(5, Math.floor(deaths / 2))
    } else if (deaths >= 5) {
      deathClusters = Math.min(3, Math.floor(deaths / 2.5))
    } else {
      deathClusters = deaths
    }
  }

  const insights: string[] = []

  // High damage but low KDA
  if (heroDamage !== null && heroDamage >= 20000 && kills + assists < 10) {
    insights.push(
      'Alto danno ma bassa KDA: sei presente nei fight ma non chiudi kill. Migliora il timing degli ultimi colpi.',
    )
  }

  // High KDA but low damage
  if (kills + assists >= 15 && heroDamage !== null && heroDamage < 15000) {
    insights.push(
      'Alto KDA ma basso danno: opportunista ma impatto limitato. Contribuisci di più ai fight.',
    )
  }

  // Death clusters
  if (deathClusters >= 3) {
    insights.push(
      `Morti ravvicinate (${deathClusters} cluster): evita di morire in sequenza. Valuta posizionamento e mappe.`,
    )
  }

  // Fight impact
  if (fightImpactScore !== null) {
    if (fightImpactScore < 40) {
      insights.push(
        'Impatto nei fight basso: lavora su posizionamento e timing di ingaggio.',
      )
    } else if (fightImpactScore >= 70) {
      insights.push(
        'Alto impatto nei fight: ottimo timing e presenza. Mantieni questo livello.',
      )
    }
  }

  return {
    heroDamage,
    heroDamagePercent,
    damageTaken: null, // Not available from Tier 1 data
    fightImpactScore,
    deathClusters,
    insights,
  }
}
