/**
 * Single Match Lane & Early Game Analysis
 * Uses: matches_digest (single match), dota_player_match_analysis (single match)
 *
 * NOTE: This is for SINGLE MATCH analysis, NOT aggregated profile analysis.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { LaneAnalysis } from './types'

export async function getMatchLaneAnalysis(
  matchId: number,
  playerId: number,
): Promise<LaneAnalysis | null> {
  const supabase = createServerClient(cookies())

  // Sanity check: MATCH MODE
  console.log(
    `[MATCH-LANE-ANALYSIS] MATCH MODE - Analisi solo per match ${matchId}`,
  )

  try {
    // Get SINGLE match data (filtered by matchId)
    const { data: match, error: matchError } = await supabase
      .from('matches_digest')
      .select(
        'match_id, start_time, last_hits, denies, gold_per_min, xp_per_min, result, lane, role_position',
      )
      .eq('player_account_id', playerId)
      .eq('match_id', matchId)
      .single()

    if (matchError || !match) {
      console.error('[MATCH-LANE-ANALYSIS] Error fetching match:', matchError)
      return null
    }

    // CS Timeline: single point (this match only)
    const csTimeline = [
      {
        matchId: match.match_id,
        csAt10: match.last_hits ?? 0, // Approximation: total last_hits
        date: new Date(match.start_time).toLocaleDateString('it-IT'),
      },
    ]

    // CS at 10 (approximation)
    const avgCsAt10 = match.last_hits ?? 0

    // XP at 10 minutes
    const avgXpAt10 = match.xp_per_min ? match.xp_per_min * 10 : 0

    // Lane result: single match result
    const laneResults = [
      {
        lane: match.lane || 'unknown',
        result: match.result === 'win' ? ('win' as const) : ('loss' as const),
        count: 1,
      },
    ]

    // Lane winrate: 100% if win, 0% if loss (single match)
    const laneWinrate = match.result === 'win' ? 100 : 0

    // First blood involvement: not available in Tier-1
    const firstBloodInvolvement = 0

    return {
      laneWinrate: Math.round(laneWinrate * 10) / 10,
      avgCsAt10: Math.round(avgCsAt10 * 10) / 10,
      avgXpAt10: Math.round(avgXpAt10),
      firstBloodInvolvement,
      csTimeline,
      laneResults,
    }
  } catch (error) {
    console.error('[MATCH-LANE-ANALYSIS] Error:', error)
    return null
  }
}
