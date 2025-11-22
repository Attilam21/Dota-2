/**
 * API Route: Player Performance Profile
 *
 * GET /api/performance/profile?playerId={id}&limit={n}
 *
 * Returns player performance profile with matches and analysis data
 * for calculating enterprise performance indices (Aggressiveness, Farm, Macro, Consistency).
 *
 * Data sources:
 * - matches_digest (or OpenDota via opendotaAdapter)
 * - dota_player_match_analysis (kills per fase)
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { getRecentMatches } from '@/services/dota/opendotaAdapter'
import type { MatchWithAnalysis } from '@/types/playerPerformance'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')
  const limitParam = searchParams.get('limit')

  if (!playerIdParam) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  const playerId = Number(playerIdParam)
  const limit = limitParam ? Number(limitParam) : 20 // Default 20 partite

  try {
    const supabase = createServerClient(cookies())

    // 1. Try to fetch matches from matches_digest first (has extended data: gpm, xpm, last_hits)
    const { data: digestData } = await supabase
      .from('matches_digest')
      .select(
        'match_id, kills, deaths, assists, duration_seconds, start_time, result, gold_per_min, xp_per_min, last_hits, denies',
      )
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: false })
      .limit(limit)

    // 2. If matches_digest has data, use it; otherwise fetch from OpenDota
    let matchesBase: Array<{
      match_id: number
      kills: number
      deaths: number
      assists: number
      duration_seconds: number
      start_time: string
      result: 'win' | 'lose'
      gold_per_min?: number | null
      xp_per_min?: number | null
      last_hits?: number | null
      denies?: number | null
    }> = []

    if (digestData && digestData.length > 0) {
      matchesBase = digestData.map((m) => ({
        match_id: m.match_id,
        kills: m.kills,
        deaths: m.deaths,
        assists: m.assists,
        duration_seconds: m.duration_seconds,
        start_time: m.start_time,
        result: m.result === 'win' ? 'win' : 'lose',
        gold_per_min: m.gold_per_min ?? null,
        xp_per_min: m.xp_per_min ?? null,
        last_hits: m.last_hits ?? null,
        denies: m.denies ?? null,
      }))
    } else {
      // Fallback: fetch from OpenDota (will not have gpm/xpm/last_hits)
      const matches = await getRecentMatches(playerId, limit)
      if (matches.length === 0) {
        return NextResponse.json([])
      }
      matchesBase = matches.map((m) => ({
        match_id: m.match_id,
        kills: m.kills,
        deaths: m.deaths,
        assists: m.assists,
        duration_seconds: m.duration_seconds,
        start_time: m.start_time,
        result: m.result,
        gold_per_min: null,
        xp_per_min: null,
        last_hits: null,
        denies: null,
      }))
    }

    if (matchesBase.length === 0) {
      return NextResponse.json([])
    }

    const matchIdsForAnalysis = matchesBase.map((m) => m.match_id)

    // 3. Fetch analysis data from Supabase (dota_player_match_analysis)
    const { data: analysisData, error: analysisError } = await supabase
      .from('dota_player_match_analysis')
      .select('match_id, kills_early, kills_mid, kills_late')
      .eq('account_id', playerId)
      .in('match_id', matchIdsForAnalysis)

    if (analysisError) {
      console.error('[PERF-PROFILE] Error loading analysis:', analysisError)
      // Continue without analysis data (non-blocking)
    }

    // 4. Create map of matchId -> analysis
    const analysisMap = new Map<
      number,
      { killsEarly: number; killsMid: number; killsLate: number }
    >()
    if (analysisData) {
      analysisData.forEach((a) => {
        analysisMap.set(a.match_id, {
          killsEarly: a.kills_early ?? 0,
          killsMid: a.kills_mid ?? 0,
          killsLate: a.kills_late ?? 0,
        })
      })
    }

    // 5. Combine matches with analysis
    // HARDENED: Always return valid MatchWithAnalysis[] structure, never undefined properties
    const matchesWithAnalysis: MatchWithAnalysis[] = matchesBase.map(
      (match) => {
        const analysis = analysisMap.get(match.match_id)

        // Ensure all numeric fields are valid numbers (never undefined/null/NaN)
        const safeKills = typeof match.kills === 'number' ? match.kills : 0
        const safeDeaths = typeof match.deaths === 'number' ? match.deaths : 0
        const safeAssists =
          typeof match.assists === 'number' ? match.assists : 0
        const safeDurationSeconds =
          typeof match.duration_seconds === 'number'
            ? match.duration_seconds
            : 0

        return {
          matchId: match.match_id,
          kills: safeKills,
          deaths: safeDeaths,
          assists: safeAssists,
          durationSeconds: safeDurationSeconds,
          result: match.result === 'win' ? 'win' : 'lose',
          gpm:
            typeof match.gold_per_min === 'number' && !isNaN(match.gold_per_min)
              ? match.gold_per_min
              : null,
          xpm:
            typeof match.xp_per_min === 'number' && !isNaN(match.xp_per_min)
              ? match.xp_per_min
              : null,
          lastHits:
            typeof match.last_hits === 'number' && !isNaN(match.last_hits)
              ? match.last_hits
              : null,
          denies:
            typeof match.denies === 'number' && !isNaN(match.denies)
              ? match.denies
              : null,
          startTime: match.start_time || new Date().toISOString(),
          // HARDENED: analysis is optional but when present, all fields must be numbers (never undefined)
          analysis: analysis
            ? {
                killsEarly:
                  typeof analysis.killsEarly === 'number'
                    ? analysis.killsEarly
                    : null,
                killsMid:
                  typeof analysis.killsMid === 'number'
                    ? analysis.killsMid
                    : null,
                killsLate:
                  typeof analysis.killsLate === 'number'
                    ? analysis.killsLate
                    : null,
              }
            : undefined,
        }
      },
    )

    return NextResponse.json(matchesWithAnalysis)
  } catch (e: any) {
    console.error('[PERF-PROFILE] Error:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Profile calculation error' },
      { status: 500 },
    )
  }
}
