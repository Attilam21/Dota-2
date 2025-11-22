/**
 * Compute Item Progression Analysis (TIER 1 ONLY)
 *
 * Calculates item timing metrics
 * Note: Item purchase data requires timeline which may not be available
 */

import type { MatchDetail } from '@/services/dota/opendotaAdapter'

export interface ItemProgressionAnalysisData {
  status: 'available' | 'unavailable'
  timeToFirstItem: number | null // minutes
  timeToMidItem: number | null
  timeToLateItem: number | null
  insights: string[]
}

/**
 * Compute item progression analysis
 * Note: Real item progression requires purchase timeline data
 */
export function computeItemProgression(
  matchDetail: MatchDetail,
): ItemProgressionAnalysisData {
  // Item purchase timeline is not available from Tier 1 data
  // This would require purchase_log from OpenDota or Supabase

  const insights: string[] = [
    'Timeline acquisti item non disponibile: richiede dati timeline non presenti in Tier-1.',
    'Per analizzare i tempi di item, verifica manualmente i replay o usa dati avanzati.',
  ]

  return {
    status: 'unavailable',
    timeToFirstItem: null,
    timeToMidItem: null,
    timeToLateItem: null,
    insights,
  }
}
