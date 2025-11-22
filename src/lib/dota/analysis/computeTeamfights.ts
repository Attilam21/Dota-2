/**
 * Compute Teamfights Analysis (TIER 1 ONLY)
 *
 * Calculates teamfight participation and outcomes
 */

import type { MatchDetail } from '@/services/dota/opendotaAdapter'
import { safeNumber, percentage } from './utils'

export interface TeamfightsAnalysisData {
  fightParticipation: number | null // 0-100
  fightOutcomeWhenPresent: 'Positive' | 'Negative' | 'Neutral' | null
  deathClustering: number // Deaths within 2 min of each other
  insights: string[]
}

/**
 * Compute teamfights analysis
 */
export function computeTeamfights(
  matchDetail: MatchDetail,
): TeamfightsAnalysisData {
  const player = matchDetail.player
  const kills = player.kills
  const deaths = player.deaths
  const assists = player.assists
  const durationMinutes = matchDetail.match.durationSeconds / 60

  // Estimate fight participation based on KDA
  // Real calculation would require team fight detection
  let fightParticipation: number | null = null
  if (durationMinutes > 0) {
    // Estimate: if player has good KDA and assists, likely high participation
    const totalActions = kills + assists
    const estimatedFights = Math.max(5, Math.floor(durationMinutes / 5)) // Rough estimate
    fightParticipation = Math.min(
      100,
      percentage(totalActions, estimatedFights * 2),
    )
  }

  // Fight outcome when present: based on KDA ratio
  let fightOutcomeWhenPresent: 'Positive' | 'Negative' | 'Neutral' | null = null
  if (deaths > 0) {
    const kdaRatio = (kills + assists) / deaths
    if (kdaRatio >= 1.5) {
      fightOutcomeWhenPresent = 'Positive'
    } else if (kdaRatio >= 0.8) {
      fightOutcomeWhenPresent = 'Neutral'
    } else {
      fightOutcomeWhenPresent = 'Negative'
    }
  }

  // Death clustering: deaths within 2 minutes
  // Estimated based on total deaths and duration
  let deathClustering = 0
  if (deaths > 0) {
    if (deaths >= 8 && durationMinutes < 35) {
      deathClustering = Math.min(5, Math.floor(deaths / 2))
    } else if (deaths >= 5) {
      deathClustering = Math.min(3, Math.floor(deaths / 2.5))
    } else {
      deathClustering = deaths
    }
  }

  const insights: string[] = []

  if (fightParticipation !== null) {
    if (fightParticipation < 40) {
      insights.push(
        'Partecipazione ai teamfight bassa: valuta di essere più presente nei momenti chiave. Macro game da migliorare.',
      )
    } else if (fightParticipation >= 70) {
      insights.push(
        'Alta partecipazione ai teamfight: ottima presenza. Mantieni questo livello.',
      )
    }
  }

  if (fightOutcomeWhenPresent === 'Negative') {
    insights.push(
      'Outcome negativo quando presente: valuta posizionamento e timing di ingaggio/disingaggio.',
    )
  } else if (fightOutcomeWhenPresent === 'Positive') {
    insights.push(
      'Outcome positivo quando presente: ottimo timing e impatto. Continua così.',
    )
  }

  if (deathClustering >= 3) {
    insights.push(
      `Death clustering elevato (${deathClustering} cluster): evita morti ravvicinate. Lavora su posizionamento e mappe.`,
    )
  }

  return {
    fightParticipation,
    fightOutcomeWhenPresent,
    deathClustering,
    insights,
  }
}
