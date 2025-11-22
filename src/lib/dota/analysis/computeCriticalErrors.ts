/**
 * Compute Critical Errors Analysis (TIER 1 ONLY)
 *
 * Identifies critical mistakes and missed opportunities
 */

import type { MatchDetail } from '@/services/dota/opendotaAdapter'
import { safeNumber } from './utils'

export interface CriticalError {
  type:
    | 'death_cluster'
    | 'low_farm'
    | 'low_impact'
    | 'objective_neglect'
    | 'inefficient_scaling'
  severity: 'high' | 'medium' | 'low'
  description: string
  suggestion: string
}

export interface CriticalErrorsAnalysisData {
  errors: CriticalError[]
}

/**
 * Compute critical errors analysis
 */
export function computeCriticalErrors(
  matchDetail: MatchDetail,
): CriticalErrorsAnalysisData {
  const player = matchDetail.player
  const kills = player.kills
  const deaths = player.deaths
  const assists = player.assists
  const heroDamage = player.heroDamage ?? null
  const towerDamage = player.towerDamage ?? null
  const gpm = player.gpm ?? null
  const xpm = player.xpm ?? null
  const durationMinutes = matchDetail.match.durationSeconds / 60

  const errors: CriticalError[] = []

  // Death clusters
  if (deaths >= 8 && durationMinutes < 35) {
    errors.push({
      type: 'death_cluster',
      severity: 'high',
      description: `Troppe morti (${deaths}) in partita breve (${Math.round(
        durationMinutes,
      )} min)`,
      suggestion:
        'Evita morti in sequenza. Valuta posizionamento, mappe e timing di ritirata.',
    })
  } else if (deaths >= 6) {
    errors.push({
      type: 'death_cluster',
      severity: 'medium',
      description: `Morti elevate (${deaths})`,
      suggestion:
        'Riduci le morti migliorando il posizionamento e la consapevolezza della mappa.',
    })
  }

  // Low farm
  if (gpm !== null && gpm < 300 && durationMinutes >= 25) {
    errors.push({
      type: 'low_farm',
      severity: 'high',
      description: `Farm molto basso (${gpm} GPM)`,
      suggestion:
        'Farm insufficiente per la durata della partita. Migliora last hit, farm pattern e gestione risorse.',
    })
  } else if (gpm !== null && gpm < 350 && durationMinutes >= 30) {
    errors.push({
      type: 'low_farm',
      severity: 'medium',
      description: `Farm sotto la media (${gpm} GPM)`,
      suggestion:
        'Migliora il farm nelle fasi avanzate. Valuta timing dei fight e del farm.',
    })
  }

  // Low impact
  if (kills + assists < 5 && deaths > 3) {
    errors.push({
      type: 'low_impact',
      severity: 'high',
      description: `Impatto molto basso (${
        kills + assists
      } kill/assist vs ${deaths} morti)`,
      suggestion:
        'Partecipa di più ai fight e contribuisci al team. Migliora posizionamento e timing.',
    })
  }

  // Objective neglect
  if (towerDamage !== null && towerDamage < 1000 && durationMinutes >= 30) {
    errors.push({
      type: 'objective_neglect',
      severity: 'medium',
      description: `Partecipazione obiettivi molto bassa (${towerDamage} danno torri)`,
      suggestion:
        'Concentrati di più sugli obiettivi. Partecipa a push e rotazioni per strutture.',
    })
  }

  // Inefficient scaling
  if (xpm !== null && xpm < 400 && durationMinutes >= 30) {
    errors.push({
      type: 'inefficient_scaling',
      severity: 'medium',
      description: `Scaling insufficiente (${xpm} XPM)`,
      suggestion:
        'XP insufficiente nelle fasi avanzate. Valuta rotazioni, partecipazione ai fight e farm.',
    })
  }

  // Limit to max 5 errors
  return {
    errors: errors.slice(0, 5),
  }
}
