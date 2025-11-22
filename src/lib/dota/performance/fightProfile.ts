/**
 * Fight Profile Calculator
 *
 * Calculates fight-related scores (Aggressiveness, Impact, Survival)
 * using ONLY basic match data: kills, deaths, assists, duration_seconds, result
 *
 * Data source: dota_player_match_analysis table (via MatchWithAnalysis)
 *
 * All scores are normalized 0-100 using fixed thresholds.
 */

import type {
  MatchWithAnalysis,
  FightProfileScores,
} from '@/types/playerPerformance'

/**
 * Utility function: safely convert value to number (fallback to 0)
 */
function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value
  }
  return fallback
}

/**
 * Clamp valore tra min e max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Get aggressiveness label based on score (0-100)
 */
function getAggressivenessLabel(score: number | null): string | null {
  if (score === null) return null
  if (score < 30) return 'Bassa presenza nei fight'
  if (score <= 70) return 'Stile equilibrato'
  return 'Molto aggressivo'
}

/**
 * Get impact label based on score (0-100)
 */
function getImpactLabel(score: number | null): string | null {
  if (score === null) return null
  if (score < 30) return 'Bassa efficienza nei fight'
  if (score <= 70) return 'Impatto nella media'
  return 'Alto impatto nei fight'
}

/**
 * Get survival label based on score (0-100)
 */
function getSurvivalLabel(score: number | null): string | null {
  if (score === null) return null
  if (score < 30) return 'Mortalità elevata'
  if (score <= 70) return 'Rischio moderato'
  return 'Ottima sopravvivenza'
}

/**
 * Calculate fight profile scores from match data
 *
 * @param matches Array of matches with basic fight data (kills, deaths, assists, duration)
 * @returns FightProfileScores with all scores and labels (null if insufficient data)
 */
export function fromMatchesToFightProfile(
  matches: MatchWithAnalysis[],
): FightProfileScores {
  // 1. Filter valid matches (must have kills, deaths, assists, duration_seconds > 0)
  const validMatches = matches.filter((match) => {
    const kills = safeNumber(match.kills)
    const deaths = safeNumber(match.deaths)
    const assists = safeNumber(match.assists)
    const durationSeconds = safeNumber(match.durationSeconds)

    // Match is valid if:
    // - duration > 0 (avoid division by zero)
    // - at least one of kills/deaths/assists is a valid number
    return (
      durationSeconds > 0 && (kills > 0 || deaths > 0 || assists > 0 || true) // Always include if duration valid
    )
  })

  // 2. If no valid matches, return all null
  if (validMatches.length === 0) {
    return {
      aggressivenessScore: null,
      impactScore: null,
      survivalScore: null,
      aggressivenessLabel: null,
      impactLabel: null,
      survivalLabel: null,
    }
  }

  // 3. Calculate per-match metrics
  const fightActivities: number[] = []
  const fightEfficiencies: number[] = []
  const survivalRates: number[] = []

  for (const match of validMatches) {
    const kills = safeNumber(match.kills)
    const deaths = safeNumber(match.deaths)
    const assists = safeNumber(match.assists)
    const durationSeconds = safeNumber(match.durationSeconds)

    // Skip if duration invalid
    if (durationSeconds <= 0) continue

    const tempoMin = Math.max(1, durationSeconds / 60)

    // Fight activity = (kills + assists) / tempo_min
    const fightActivity = (kills + assists) / tempoMin
    if (!isNaN(fightActivity) && isFinite(fightActivity)) {
      fightActivities.push(fightActivity)
    }

    // Fight efficiency = (kills + assists) / max(1, deaths)
    const fightEfficiency = (kills + assists) / Math.max(1, deaths)
    if (!isNaN(fightEfficiency) && isFinite(fightEfficiency)) {
      fightEfficiencies.push(fightEfficiency)
    }

    // Survival rate = 1 - (deaths / max(1, kills + assists + deaths))
    const totalEvents = Math.max(1, kills + assists + deaths)
    const survivalRate = 1 - deaths / totalEvents
    if (!isNaN(survivalRate) && isFinite(survivalRate)) {
      survivalRates.push(survivalRate)
    }
  }

  // 4. Calculate averages (only if we have valid data points)
  const avgFightActivity =
    fightActivities.length > 0
      ? fightActivities.reduce((a, b) => a + b, 0) / fightActivities.length
      : 0
  const avgFightEfficiency =
    fightEfficiencies.length > 0
      ? fightEfficiencies.reduce((a, b) => a + b, 0) / fightEfficiencies.length
      : 0
  const avgSurvivalRate =
    survivalRates.length > 0
      ? survivalRates.reduce((a, b) => a + b, 0) / survivalRates.length
      : 0

  // 5. Normalize to 0-100 with fixed thresholds

  // Aggressiveness: map avgFightActivity from [0, 5] K+A/min to [0, 100]
  const aggressivenessScore = clamp((avgFightActivity / 5) * 100, 0, 100)

  // Impact: map avgFightEfficiency from [0, 5] K+A/death to [0, 100]
  const impactScore = clamp((avgFightEfficiency / 5) * 100, 0, 100)

  // Survival: avgSurvivalRate is already 0-1, scale to 0-100
  const survivalScore = clamp(avgSurvivalRate * 100, 0, 100)

  // 6. Generate labels
  const aggressivenessLabel = getAggressivenessLabel(aggressivenessScore)
  const impactLabel = getImpactLabel(impactScore)
  const survivalLabel = getSurvivalLabel(survivalScore)

  return {
    aggressivenessScore,
    impactScore,
    survivalScore,
    aggressivenessLabel,
    impactLabel,
    survivalLabel,
  }
}
