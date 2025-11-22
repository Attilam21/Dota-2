/**
 * Lane & Early Game Analysis
 * Uses: matches_digest, dota_player_match_analysis
 *
 * NOTE: CS@10 and XP@10 are approximations since OpenDota Tier-1 doesn't provide
 * per-minute data. We use total last_hits and xp_per_min * 10 as proxies.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { LaneAnalysis } from './types'

export async function getLaneAnalysis(
  playerId: number,
): Promise<LaneAnalysis | null> {
  const supabase = createServerClient(cookies())

  try {
    // Get recent matches with lane data (limit to 20 for DEMO mode consistency)
    const { data: matches, error: matchesError } = await supabase
      .from('matches_digest')
      .select(
        'match_id, start_time, last_hits, denies, gold_per_min, xp_per_min, result, lane, role_position',
      )
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: false })
      .limit(20) // DEMO mode: 20 matches

    if (matchesError) {
      console.error('[LANE-ANALYSIS] Error fetching matches:', matchesError)
      return null
    }

    if (!matches || matches.length === 0) {
      return null
    }

    // CS Timeline: use total last_hits as proxy for CS@10
    // NOTE: OpenDota Tier-1 doesn't provide CS at specific minutes
    // We use total last_hits as approximation (most CS happens in first 10 min for cores)
    const csTimeline = matches
      .filter((m) => m.last_hits != null && m.last_hits > 0)
      .map((m) => ({
        matchId: m.match_id,
        csAt10: m.last_hits ?? 0, // Approximation: total last_hits
        date: new Date(m.start_time).toLocaleDateString('it-IT'),
      }))

    // Calculate average CS (proxy for CS@10)
    const avgCsAt10 =
      csTimeline.length > 0
        ? csTimeline.reduce((sum, m) => sum + m.csAt10, 0) / csTimeline.length
        : 0

    // Calculate average XP at 10 minutes (xp_per_min * 10)
    const matchesWithXpm = matches.filter(
      (m) => m.xp_per_min != null && m.xp_per_min > 0,
    )
    const avgXpAt10 =
      matchesWithXpm.length > 0
        ? matchesWithXpm.reduce((sum, m) => sum + (m.xp_per_min ?? 0) * 10, 0) /
          matchesWithXpm.length
        : 0

    // Lane results: group by lane and result
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

    const laneResults = Array.from(laneResultsMap.entries())
      .filter(([lane]) => lane !== 'unknown') // Filter out unknown lanes
      .flatMap(([lane, counts]) => [
        { lane, result: 'win' as const, count: counts.win },
        { lane, result: 'even' as const, count: counts.even },
        { lane, result: 'loss' as const, count: counts.loss },
      ])
      .filter((lr) => lr.count > 0) // Only show lanes with data

    // Lane winrate: % of matches won
    const wins = matches.filter((m) => m.result === 'win').length
    const laneWinrate = matches.length > 0 ? (wins / matches.length) * 100 : 0

    // First blood involvement: not available in Tier-1 OpenDota data
    // Return 0 with note that it's not available
    const firstBloodInvolvement = 0

    return {
      laneWinrate: Math.round(laneWinrate * 10) / 10, // Round to 1 decimal
      avgCsAt10: Math.round(avgCsAt10 * 10) / 10,
      avgXpAt10: Math.round(avgXpAt10),
      firstBloodInvolvement,
      csTimeline: csTimeline.slice(0, 20), // Last 20 matches
      laneResults,
    }
  } catch (error) {
    console.error('[LANE-ANALYSIS] Error:', error)
    return null
  }
}
