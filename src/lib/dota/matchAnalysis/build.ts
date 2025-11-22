/**
 * Build Analysis (TIER 1 ONLY)
 *
 * Calculates item build analysis
 */

import type { BuildAnalysis } from '@/types/matchAnalysis'

/**
 * Calculate build analysis
 * Note: Item purchase data requires timeline which may not be available from OpenDota
 */
export function calculateBuildAnalysis(): BuildAnalysis {
  // Item purchase timeline is not directly available from OpenDota match detail
  // This would require purchase_log or similar timeline data
  // Set as unavailable until we have proper item timeline support
  return {
    status: 'unavailable',
    coreItems: [],
    insight: null,
  }
}

/**
 * Generate insight text for build (placeholder for future implementation)
 */
export function getBuildInsight(data: BuildAnalysis): string | null {
  if (data.status === 'unavailable') {
    return null
  }

  if (data.coreItems.length === 0) {
    return null
  }

  // Check for late defensive items
  const bkb = data.coreItems.find((item) =>
    item.itemName.toLowerCase().includes('black king bar'),
  )
  if (bkb && bkb.differenceMinutes && bkb.differenceMinutes > 5) {
    return 'Item difensivo chiave (BKB) acquistato in ritardo rispetto al meta: valuta di anticiparlo.'
  }

  // Check if build is meta-aligned
  const allOnTime = data.coreItems.every(
    (item) => !item.differenceMinutes || Math.abs(item.differenceMinutes) <= 3,
  )
  if (allOnTime) {
    return 'Build coerente con il meta: mantieni questo approccio.'
  }

  return 'Analizza i tempi di acquisto degli item core per ottimizzare i power spike.'
}
