/**
 * Farm & Economy Analysis
 * Uses: matches_digest, dota_player_match_analysis (for total_gold_lost)
 *
 * NOTE: Item timing requires dota_item_progression table which doesn't exist.
 * We return null for avgItemTiming.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { FarmEconomyAnalysis } from './types'

export async function getFarmEconomyAnalysis(
  playerId: number,
): Promise<FarmEconomyAnalysis | null> {
  const supabase = createServerClient(cookies())

  try {
    // Get recent matches with economy data (limit to 20 for DEMO mode)
    const { data: matches, error: matchesError } = await supabase
      .from('matches_digest')
      .select(
        'match_id, gold_per_min, xp_per_min, duration_seconds, result, start_time',
      )
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: false })
      .limit(20) // DEMO mode: 20 matches

    if (matchesError) {
      console.error('[ECONOMY-ANALYSIS] Error fetching matches:', matchesError)
      return null
    }

    if (!matches || matches.length === 0) {
      return null
    }

    // Calculate average GPM and XPM (only from matches with valid data)
    const validGpm = matches.filter(
      (m) => m.gold_per_min != null && m.gold_per_min > 0,
    )
    const validXpm = matches.filter(
      (m) => m.xp_per_min != null && m.xp_per_min > 0,
    )

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

    // Calculate dead gold from dota_player_match_analysis (more accurate than summing death events)
    const matchIds = matches.map((m) => m.match_id)
    const { data: matchAnalysis, error: analysisError } = await supabase
      .from('dota_player_match_analysis')
      .select('match_id, total_gold_lost')
      .eq('account_id', playerId)
      .in('match_id', matchIds)

    let deadGold = 0
    if (!analysisError && matchAnalysis && matchAnalysis.length > 0) {
      const totalGoldLost = matchAnalysis.reduce(
        (sum, m) => sum + (m.total_gold_lost ?? 0),
        0,
      )
      deadGold =
        matchAnalysis.length > 0 ? totalGoldLost / matchAnalysis.length : 0
    } else {
      // Fallback: calculate from death events if match_analysis not available
      const { data: deathEvents } = await supabase
        .from('dota_player_death_events')
        .select('match_id, gold_lost')
        .eq('account_id', playerId)
        .in('match_id', matchIds)

      if (deathEvents && deathEvents.length > 0) {
        const totalGoldLost = deathEvents.reduce(
          (sum, e) => sum + (e.gold_lost ?? 0),
          0,
        )
        // Group by match to get average per match
        const matchesWithDeaths = new Set(deathEvents.map((e) => e.match_id))
        deadGold =
          matchesWithDeaths.size > 0
            ? totalGoldLost / matchesWithDeaths.size
            : 0
      }
    }

    // GPM timeline: create synthetic profile based on average GPM
    // Since we don't have per-minute data, we approximate: GPM typically increases over time
    // Formula: GPM(min) = avgGPM * (0.4 + 0.6 * (min/60)) for first 60 minutes
    const maxDuration = Math.max(
      ...matches.map((m) => m.duration_seconds ?? 0),
      3600,
    )
    const maxMinutes = Math.min(60, Math.ceil(maxDuration / 60))
    const gpmTimeline = Array.from({ length: maxMinutes }, (_, i) => {
      const minute = i + 1
      // Approximation: GPM increases from 40% to 100% of average over 60 minutes
      const factor = 0.4 + 0.6 * (minute / 60)
      return {
        minute,
        avgGpm: avgGpm * factor,
      }
    })

    // GPM comparison: recent 10 matches vs overall average
    const recentMatches = matches.slice(0, 10)
    const recentGpm =
      recentMatches.filter((m) => m.gold_per_min != null && m.gold_per_min > 0)
        .length > 0
        ? recentMatches
            .filter((m) => m.gold_per_min != null && m.gold_per_min > 0)
            .reduce((sum, m) => sum + (m.gold_per_min ?? 0), 0) /
          recentMatches.filter(
            (m) => m.gold_per_min != null && m.gold_per_min > 0,
          ).length
        : 0

    const recentXpm =
      recentMatches.filter((m) => m.xp_per_min != null && m.xp_per_min > 0)
        .length > 0
        ? recentMatches
            .filter((m) => m.xp_per_min != null && m.xp_per_min > 0)
            .reduce((sum, m) => sum + (m.xp_per_min ?? 0), 0) /
          recentMatches.filter((m) => m.xp_per_min != null && m.xp_per_min > 0)
            .length
        : 0

    const gpmComparison = [
      { period: 'Ultimi 10 match', gpm: recentGpm, xpm: recentXpm },
      { period: 'Media generale', gpm: avgGpm, xpm: avgXpm },
    ]

    // Item timing: not available in Tier-1 OpenDota data
    // dota_item_progression table doesn't exist
    const avgItemTiming = null

    return {
      avgGpm: Math.round(avgGpm),
      avgXpm: Math.round(avgXpm),
      deadGold: Math.round(deadGold),
      avgItemTiming,
      gpmTimeline,
      gpmComparison,
    }
  } catch (error) {
    console.error('[ECONOMY-ANALYSIS] Error:', error)
    return null
  }
}
