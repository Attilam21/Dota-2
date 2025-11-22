/**
 * API Route: Player Profile Aggregate
 *
 * GET /api/profile/aggregate?playerId={id}
 *
 * Returns complete FZTH player profile with identity, pillars, tasks, progress, and focus areas
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { computeProfileIdentity } from '@/lib/dota/profile/computeProfileIdentity'
import { computePillars } from '@/lib/dota/profile/computePillars'
import { computeTasksSummary } from '@/lib/dota/profile/computeTasksSummary'
import { computeProgressTimeline } from '@/lib/dota/profile/computeProgressTimeline'
import { computeFocusAreas } from '@/lib/dota/profile/computeFocusAreas'
import type { PlayerProfileAggregate } from '@/lib/dota/profile/types'
import { calculatePlayerPerformanceProfile } from '@/lib/dota/performanceProfile'
import { fromMatchesToFightProfile } from '@/lib/dota/performance/fightProfile'
import type { MatchWithAnalysis } from '@/types/playerPerformance'
import { getRecentMatches } from '@/services/dota/opendotaAdapter'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')

  if (!playerIdParam) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  const playerId = Number(playerIdParam)

  if (!Number.isFinite(playerId)) {
    return NextResponse.json({ error: 'Invalid playerId' }, { status: 400 })
  }

  try {
    const supabase = createServerClient(cookies())

    // 1. Fetch matches (reuse performance profile logic)
    const { data: digestData } = await supabase
      .from('matches_digest')
      .select(
        'match_id, kills, deaths, assists, duration_seconds, start_time, result, gold_per_min, xp_per_min, last_hits, denies',
      )
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: false })
      .limit(30)

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
      const matches = await getRecentMatches(playerId, 30)
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
      return NextResponse.json({
        error: 'No matches found for this player',
      })
    }

    // 2. Fetch analysis data
    const matchIds = matchesBase.map((m) => m.match_id)
    const { data: analysisData } = await supabase
      .from('dota_player_match_analysis')
      .select('match_id, kills_early, kills_mid, kills_late')
      .eq('account_id', playerId)
      .in('match_id', matchIds)

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

    // 3. Build MatchWithAnalysis array
    const matchesWithAnalysis: MatchWithAnalysis[] = matchesBase.map(
      (match) => {
        const analysis = analysisMap.get(match.match_id)
        return {
          matchId: match.match_id,
          kills: match.kills,
          deaths: match.deaths,
          assists: match.assists,
          durationSeconds: match.duration_seconds,
          result: match.result,
          gpm: match.gold_per_min ?? null,
          xpm: match.xp_per_min ?? null,
          lastHits: match.last_hits ?? null,
          denies: match.denies ?? null,
          startTime: match.start_time,
          analysis: analysis
            ? {
                killsEarly: analysis.killsEarly,
                killsMid: analysis.killsMid,
                killsLate: analysis.killsLate,
              }
            : undefined,
        }
      },
    )

    // 4. Calculate performance profile
    const performanceProfile =
      calculatePlayerPerformanceProfile(matchesWithAnalysis)
    const fightProfile = fromMatchesToFightProfile(matchesWithAnalysis)

    // 5. Fetch tasks (try both dota_tasks and fzth_player_tasks)
    let tasks: Array<{
      id: string
      player_account_id: number
      type: string
      status:
        | 'open'
        | 'completed'
        | 'failed'
        | 'pending'
        | 'in_progress'
        | 'blocked'
      category?: string | null
    }> = []

    // Try fzth_player_tasks first (new schema)
    const { data: fzthTasksData } = await supabase
      .from('fzth_player_tasks')
      .select(
        'id, player_account_id, status, task_id, fzth_coaching_tasks(code, pillar)',
      )
      .eq('player_account_id', playerId)

    if (fzthTasksData && fzthTasksData.length > 0) {
      tasks = fzthTasksData.map((t) => ({
        id: t.id,
        player_account_id: playerId,
        type: (t.fzth_coaching_tasks as any)?.code || 'unknown',
        status: (t.status === 'pending' || t.status === 'in_progress'
          ? 'open'
          : t.status === 'completed'
            ? 'completed'
            : 'failed') as 'open' | 'completed' | 'failed',
        category: (t.fzth_coaching_tasks as any)?.pillar || null,
      }))
    } else {
      // Fallback to dota_tasks (old schema)
      const { data: tasksData } = await supabase
        .from('dota_tasks')
        .select('id, player_id, type, status, category')
        .eq('player_id', String(playerId))

      tasks = (tasksData || []).map((t) => ({
        id: t.id,
        player_account_id: playerId,
        type: t.type,
        status: (t.status === 'open'
          ? 'open'
          : t.status === 'completed'
            ? 'completed'
            : 'failed') as 'open' | 'completed' | 'failed',
        category: t.category,
      }))
    }

    // 6. Compute all profile components
    const identity = computeProfileIdentity(playerId, performanceProfile)
    const pillars = computePillars(performanceProfile, fightProfile)
    const tasksSummary = await computeTasksSummary(playerId, tasks)
    const progress = computeProgressTimeline(matchesWithAnalysis)
    const focusAreas = computeFocusAreas(pillars, tasksSummary)

    // 7. Build aggregate response
    const aggregate: PlayerProfileAggregate = {
      identity,
      pillars,
      tasks: tasksSummary,
      progress,
      focusAreas,
    }

    return NextResponse.json(aggregate)
  } catch (e: any) {
    console.error('[API/PROFILE/AGGREGATE] Error:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch profile aggregate' },
      { status: 500 },
    )
  }
}
