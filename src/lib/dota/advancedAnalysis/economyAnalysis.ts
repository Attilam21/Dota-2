/**
 * Farm & Economy Analysis
 * Uses: matches_digest, dota_player_match_analysis, dota_player_death_events
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { FarmEconomyAnalysis } from './types'

export async function getFarmEconomyAnalysis(
  playerId: number,
): Promise<FarmEconomyAnalysis | null> {
  const supabase = createServerClient(cookies())

  try {
    // Get recent matches with economy data
    const { data: matches, error: matchesError } = await supabase
      .from('matches_digest')
      .select('match_id, gold_per_min, xp_per_min, duration_seconds, result')
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: false })
      .limit(50)

    if (matchesError) {
      console.error('[ECONOMY-ANALYSIS] Error fetching matches:', matchesError)
      return null
    }

    if (!matches || matches.length === 0) {
      return null
    }

    // Calculate average GPM and XPM
    const validGpm = matches.filter((m) => m.gold_per_min != null)
    const validXpm = matches.filter((m) => m.xp_per_min != null)

    const avgGpm =
      validGpm.length > 0
        ? validGpm.reduce((sum, m) => sum + (m.gold_per_min ?? 0), 0) /
          validGpm.length
        : 0

    const avgXpm =
      validXpm.length > 0
        ? validXpm.reduce((sum, m) => sum + (m.xp_per_min ?? 0), 0) /
          validXpm.length
        : 0

    // Calculate dead gold from death events
    const { data: deathEvents, error: deathError } = await supabase
      .from('dota_player_death_events')
      .select('match_id, gold_lost')
      .eq('account_id', playerId)
      .in(
        'match_id',
        matches.map((m) => m.match_id),
      )

    let deadGold = 0
    if (!deathError && deathEvents) {
      const totalGoldLost = deathEvents.reduce(
        (sum, e) => sum + (e.gold_lost ?? 0),
        0,
      )
      deadGold = matches.length > 0 ? totalGoldLost / matches.length : 0
    }

    // GPM timeline (simplified: average GPM per minute bucket)
    // Since we don't have per-minute data, we create a synthetic profile
    const gpmTimeline = Array.from({ length: 60 }, (_, i) => ({
      minute: i + 1,
      avgGpm: avgGpm * (0.5 + (i + 1) / 120), // Approximation: GPM increases over time
    }))

    // GPM comparison: recent vs overall
    const recentMatches = matches.slice(0, 10)
    const recentGpm =
      recentMatches.filter((m) => m.gold_per_min != null).length > 0
        ? recentMatches
            .filter((m) => m.gold_per_min != null)
            .reduce((sum, m) => sum + (m.gold_per_min ?? 0), 0) /
          recentMatches.filter((m) => m.gold_per_min != null).length
        : 0

    const recentXpm =
      recentMatches.filter((m) => m.xp_per_min != null).length > 0
        ? recentMatches
            .filter((m) => m.xp_per_min != null)
            .reduce((sum, m) => sum + (m.xp_per_min ?? 0), 0) /
          recentMatches.filter((m) => m.xp_per_min != null).length
        : 0

    const gpmComparison = [
      { period: 'Ultimi 10 match', gpm: recentGpm, xpm: recentXpm },
      { period: 'Media generale', gpm: avgGpm, xpm: avgXpm },
    ]

    // Item timing (placeholder - would need dota_item_progression table)
    const avgItemTiming = null

    return {
      avgGpm,
      avgXpm,
      deadGold,
      avgItemTiming,
      gpmTimeline,
      gpmComparison,
    }
  } catch (error) {
    console.error('[ECONOMY-ANALYSIS] Error:', error)
    return null
  }
}
