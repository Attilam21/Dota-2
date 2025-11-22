/**
 * Vision Analysis (TIER 1 ONLY)
 *
 * Calculates vision metrics
 */

import type { VisionAnalysis } from '@/types/matchAnalysis'

/**
 * Calculate vision analysis
 * Note: Ward data is not directly available from OpenDota match detail
 */
export function calculateVisionAnalysis(): VisionAnalysis {
  // Ward placement data (observer_placed, sentry_placed, wards_killed)
  // is not available in OpenDota match detail endpoint
  // This would require additional API calls or Supabase data
  return {
    status: 'unavailable',
    observerPlaced: null,
    sentryPlaced: null,
    wardsKilled: null,
    avgWardDuration: null,
    insight: null,
  }
}

/**
 * Generate insight text for vision (placeholder for future implementation)
 */
export function getVisionInsight(data: VisionAnalysis): string | null {
  if (data.status === 'unavailable') {
    return null
  }

  const { observerPlaced, sentryPlaced } = data

  if (observerPlaced !== null && sentryPlaced !== null) {
    if (observerPlaced >= 10 && sentryPlaced < 3) {
      return 'Visione early buona, ma cala nel late: rialloca risorse per mantenere il controllo mappa.'
    }

    if (sentryPlaced < 2) {
      return 'Basso numero di sentry: valuta più investimento per denial visione.'
    }
  }

  return null
}
