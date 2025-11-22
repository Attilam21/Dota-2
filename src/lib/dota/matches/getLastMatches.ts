/**
 * Centralized function to get last N matches for a player
 * Used by ALL global analysis pages (Panoramica, Performance, Profilazione, Analisi Avanzate)
 *
 * @param playerId - Dota account ID
 * @param limit - Maximum number of matches to return (default: 20)
 * @returns Array of match IDs (most recent first)
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

export async function getLastMatches(
  playerId: number,
  limit: number = 20,
): Promise<number[]> {
  const supabase = createServerClient(cookies())

  try {
    const { data: matches, error } = await supabase
      .from('matches_digest')
      .select('match_id')
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getLastMatches] Error fetching matches:', error)
      return []
    }

    if (!matches || matches.length === 0) {
      return []
    }

    return matches.map((m) => Number(m.match_id))
  } catch (error) {
    console.error('[getLastMatches] Error:', error)
    return []
  }
}

/**
 * Get last N matches with full data
 * Used when you need match details, not just IDs
 */
export async function getLastMatchesWithData(
  playerId: number,
  limit: number = 20,
): Promise<
  Array<{ match_id: number; start_time: string; [key: string]: any }>
> {
  const supabase = createServerClient(cookies())

  try {
    const { data: matches, error } = await supabase
      .from('matches_digest')
      .select('*')
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getLastMatchesWithData] Error fetching matches:', error)
      return []
    }

    return matches || []
  } catch (error) {
    console.error('[getLastMatchesWithData] Error:', error)
    return []
  }
}
