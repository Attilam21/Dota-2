/**
 * Lane & Early Game Analysis
 * Uses: matches_digest, dota_player_match_analysis
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { LaneAnalysis } from './types'

export async function getLaneAnalysis(
  playerId: number,
): Promise<LaneAnalysis | null> {
  const supabase = createServerClient(cookies())

  try {
    // Get recent matches with lane data
    const { data: matches, error: matchesError } = await supabase
      .from('matches_digest')
      .select(
        'match_id, start_time, last_hits, denies, gold_per_min, xp_per_min, result, lane, role_position',
      )
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: false })
      .limit(50)

    if (matchesError) {
      console.error('[LANE-ANALYSIS] Error fetching matches:', matchesError)
      return null
    }

    if (!matches || matches.length === 0) {
      return null
    }

    // Calculate CS at 10 minutes (approximation: assume 10 min = 600s, use last_hits if available)
    // Note: OpenDota doesn't provide CS at specific minutes, so we use total last_hits as proxy
    const csTimeline = matches
      .filter((m) => m.last_hits != null)
      .map((m) => ({
        matchId: m.match_id,
        csAt10: m.last_hits ?? 0, // Approximation
        date: new Date(m.start_time).toLocaleDateString('it-IT'),
      }))

    // Calculate average CS at 10
    const avgCsAt10 =
      csTimeline.length > 0
        ? csTimeline.reduce((sum, m) => sum + m.csAt10, 0) / csTimeline.length
        : 0

    // Calculate average XP at 10 (approximation using xp_per_min * 10)
    const avgXpAt10 =
      matches
        .filter((m) => m.xp_per_min != null)
        .reduce((sum, m) => sum + (m.xp_per_min ?? 0) * 10, 0) /
      Math.max(1, matches.filter((m) => m.xp_per_min != null).length)

    // Lane results (simplified: win = result='win', even = close match, loss = result='lose')
    const laneResultsMap = new Map<
      string,
      { win: number; even: number; loss: number }
    >()
    matches.forEach((m) => {
      const lane = m.lane || 'unknown'
      const current = laneResultsMap.get(lane) || { win: 0, even: 0, loss: 0 }
      if (m.result === 'win') current.win++
      else if (m.result === 'lose') current.loss++
      else current.even++
      laneResultsMap.set(lane, current)
    })

    const laneResults = Array.from(laneResultsMap.entries()).flatMap(
      ([lane, counts]) => [
        { lane, result: 'win' as const, count: counts.win },
        { lane, result: 'even' as const, count: counts.even },
        { lane, result: 'loss' as const, count: counts.loss },
      ],
    )

    // Lane winrate (simplified: % of wins)
    const wins = matches.filter((m) => m.result === 'win').length
    const laneWinrate = matches.length > 0 ? (wins / matches.length) * 100 : 0

    // First blood involvement (placeholder - would need match details)
    const firstBloodInvolvement = 0 // TODO: Calculate from match details if available

    return {
      laneWinrate,
      avgCsAt10,
      avgXpAt10,
      firstBloodInvolvement,
      csTimeline: csTimeline.slice(0, 20), // Last 20 matches
      laneResults,
    }
  } catch (error) {
    console.error('[LANE-ANALYSIS] Error:', error)
    return null
  }
}
