/**
 * Actions Analysis (TIER 1 ONLY)
 *
 * Calculates APM (Actions Per Minute) metrics
 */

import type { ActionsAnalysis } from '@/types/matchAnalysis'

/**
 * Calculate actions analysis
 * Note: APM data requires spell casts, item usage tracking which is not available from OpenDota
 */
export function calculateActionsAnalysis(): ActionsAnalysis {
  // APM calculation requires:
  // - Spell casts per minute
  // - Item active usage
  // - Glyph/scan/courier usage
  // These are not available from OpenDota match detail endpoint
  return {
    status: 'unavailable',
    apmTotal: null,
    apmByPhase: {
      early: null,
      mid: null,
      late: null,
    },
    insight: null,
  }
}

/**
 * Generate insight text for actions (placeholder for future implementation)
 */
export function getActionsInsight(data: ActionsAnalysis): string | null {
  if (data.status === 'unavailable') {
    return null
  }

  const { apmTotal, apmByPhase } = data

  if (apmTotal !== null) {
    if (
      apmTotal >= 200 &&
      apmByPhase.early !== null &&
      apmByPhase.early < 150
    ) {
      return 'Molte azioni ma poco impatto: riduci input inutili e focalizzati sui momenti chiave.'
    }

    if (apmTotal < 100) {
      return 'APM basso ma efficiente: valuta se incrementare la frequenza di check mappa e spell usage.'
    }
  }

  return null
}
