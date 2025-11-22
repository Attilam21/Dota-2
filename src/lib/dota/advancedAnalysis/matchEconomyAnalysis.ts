/**
 * Single Match Farm & Economy Analysis
 * Uses: matches_digest (single match), dota_player_match_analysis (single match)
 *
 * NOTE: This is for SINGLE MATCH analysis, NOT aggregated profile analysis.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { FarmEconomyAnalysis } from './types'

export async function getMatchEconomyAnalysis(
  matchId: number,
  playerId: number,
): Promise<FarmEconomyAnalysis | null> {
  const supabase = createServerClient(cookies())

  // Sanity check: MATCH MODE
  console.log(
    `[MATCH-ECONOMY-ANALYSIS] MATCH MODE - Analisi solo per match ${matchId}`,
  )

  try {
    // Get SINGLE match data (filtered by matchId)
    const { data: match, error: matchError } = await supabase
      .from('matches_digest')
      .select(
        'match_id, gold_per_min, xp_per_min, duration_seconds, result, start_time',
      )
      .eq('player_account_id', playerId)
      .eq('match_id', matchId)
      .single()

    if (matchError || !match) {
      console.error(
        '[MATCH-ECONOMY-ANALYSIS] Error fetching match:',
        matchError,
      )
      return null
    }

    // GPM and XPM: single match values
    const avgGpm = match.gold_per_min ?? 0
    const avgXpm = match.xp_per_min ?? 0

    // Dead Gold: from dota_player_match_analysis for THIS match
    const { data: matchAnalysis, error: analysisError } = await supabase
      .from('dota_player_match_analysis')
      .select('match_id, total_gold_lost')
      .eq('account_id', playerId)
      .eq('match_id', matchId)
      .single()

    let deadGold = 0
    if (!analysisError && matchAnalysis) {
      deadGold = matchAnalysis.total_gold_lost ?? 0
    } else {
      // Fallback: calculate from death events for THIS match
      const { data: deathEvents } = await supabase
        .from('dota_player_death_events')
        .select('gold_lost')
        .eq('account_id', playerId)
        .eq('match_id', matchId)

      if (deathEvents && deathEvents.length > 0) {
        deadGold = deathEvents.reduce((sum, e) => sum + (e.gold_lost ?? 0), 0)
      }
    }

    // GPM timeline: single match profile (approximation based on duration)
    const durationMinutes = Math.min(
      60,
      Math.ceil((match.duration_seconds ?? 0) / 60),
    )
    const gpmTimeline = Array.from({ length: durationMinutes }, (_, i) => {
      const minute = i + 1
      // Approximation: GPM increases from 40% to 100% of match GPM over duration
      const factor = 0.4 + 0.6 * (minute / durationMinutes)
      return {
        minute,
        avgGpm: avgGpm * factor,
      }
    })

    // GPM comparison: single match vs itself (not meaningful, but keep structure)
    const gpmComparison = [
      { period: 'Questo match', gpm: avgGpm, xpm: avgXpm },
      { period: 'Questo match', gpm: avgGpm, xpm: avgXpm }, // Same for consistency
    ]

    // Item timing: not available in Tier-1
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
    console.error('[MATCH-ECONOMY-ANALYSIS] Error:', error)
    return null
  }
}
