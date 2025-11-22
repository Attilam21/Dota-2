/**
 * Kill Distribution Analysis (TIER 1 ONLY)
 *
 * Calculates kill distribution by game phase and generates insights
 */

import type { KillDistribution } from '@/types/matchAnalysis'
import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'

/**
 * Calculate kill distribution from analysis data
 */
export function calculateKillDistribution(
  analysis: DotaPlayerMatchAnalysis | null,
): KillDistribution {
  if (!analysis) {
    return {
      early: 0,
      mid: 0,
      late: 0,
      total: 0,
      percentages: { early: 0, mid: 0, late: 0 },
      insight: null,
    }
  }

  const { killDistribution, killPercentageDistribution } = analysis
  const total =
    killDistribution.early + killDistribution.mid + killDistribution.late

  const insight = getKillDistributionInsight({
    early: killDistribution.early,
    mid: killDistribution.mid,
    late: killDistribution.late,
    total,
    percentages: killPercentageDistribution,
  })

  return {
    early: killDistribution.early,
    mid: killDistribution.mid,
    late: killDistribution.late,
    total,
    percentages: {
      early: killPercentageDistribution.early,
      mid: killPercentageDistribution.mid,
      late: killPercentageDistribution.late,
    },
    insight,
  }
}

/**
 * Generate insight text for kill distribution
 */
function getKillDistributionInsight(
  data: Pick<
    KillDistribution,
    'early' | 'mid' | 'late' | 'total' | 'percentages'
  >,
): string | null {
  if (data.total === 0) {
    return 'Nessuna kill registrata in questa partita.'
  }

  const { early, mid, late, percentages } = data

  // Kill concentrate in Late Game
  if (percentages.late >= 60 && percentages.early < 20) {
    return "Kill concentrate in Late Game: valuta se anticipare l'impatto nelle fasi Early/Mid."
  }

  // Kill concentrate in Early Game
  if (percentages.early >= 60 && percentages.late < 20) {
    return 'Kill concentrate in Early Game: buon early ma impatto limitato nel late. Lavora sulla transizione mid/late.'
  }

  // Distribuzione bilanciata
  if (
    percentages.early >= 25 &&
    percentages.early <= 45 &&
    percentages.mid >= 25 &&
    percentages.mid <= 45 &&
    percentages.late >= 20 &&
    percentages.late <= 40
  ) {
    return 'Distribuzione bilanciata delle kill tra le fasi: mantieni questo pattern.'
  }

  // Mid game focus
  if (percentages.mid >= 50) {
    return 'Focus su Mid Game: ottima presenza nella fase centrale. Mantieni questo timing.'
  }

  // Default insight
  return `Distribuzione: ${early} early, ${mid} mid, ${late} late. Analizza le fasi per ottimizzare l'impatto.`
}
