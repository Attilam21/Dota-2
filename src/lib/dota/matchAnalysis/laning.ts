/**
 * Laning Analysis (TIER 1 ONLY)
 *
 * Calculates laning phase (0-10 min) metrics and generates insights
 */

import type { LaningAnalysis } from '@/types/matchAnalysis'
import type { MatchDetail } from '@/services/dota/opendotaAdapter'

/**
 * Calculate laning analysis from match detail
 * Note: CS@10 and denies@10 require timeline data which may not be available
 */
export function calculateLaningAnalysis(
  matchDetail: MatchDetail,
): LaningAnalysis {
  // For now, we don't have CS@10 timeline data from OpenDota
  // This would require gold_t or similar timeline data
  // Set as unavailable until we have proper timeline support
  return {
    status: 'unavailable',
    csAt10: null,
    deniesAt10: null,
    networthAt10: null,
    laneOutcome: null,
    csTimeline: null,
    insight: null,
  }
}

/**
 * Generate insight text for laning (placeholder for future implementation)
 */
export function getLaningInsight(data: LaningAnalysis): string | null {
  if (data.status === 'unavailable') {
    return null
  }

  if (data.laneOutcome === 'vinta') {
    return 'Lane vinta grazie al controllo CS (CS@10 sopra la soglia)'
  }

  if (data.laneOutcome === 'persa') {
    return 'Lane persa: pochi denies e CS@10 basso, lavora sulla gestione wave e last hit.'
  }

  if (data.laneOutcome === 'pari') {
    return 'Lane pari: CS@10 nella media. Valuta piccoli miglioramenti nel trading e nel controllo wave.'
  }

  return null
}
