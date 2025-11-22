/**
 * API Route: Coaching Dashboard Data
 *
 * GET /api/coaching/dashboard?playerId={id}
 *
 * Returns coaching dashboard data with tasks grouped by pillar.
 * Automatically creates tasks from profiling if needed.
 */

import { NextResponse } from 'next/server'
import { getCoachingDashboardData } from '@/lib/dota/coaching/fetchCoachingData'
import {
  getPlayerTasks,
  createTasksFromProfiling,
} from '@/lib/fzth/coaching/repository'
import { getImprovementPillars } from '@/lib/fzth/profiling/getImprovementPillars'
import { getCoachingImpactSummary } from '@/lib/fzth/coaching/repository'
import { calculatePlayerPerformanceProfile } from '@/lib/dota/performanceProfile'
import { fromMatchesToFightProfile } from '@/lib/dota/performance/fightProfile'
import { computePillars } from '@/lib/dota/profile/computePillars'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { getRecentMatches } from '@/services/dota/opendotaAdapter'
import type { MatchWithAnalysis } from '@/types/playerPerformance'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')
  const autoCreateTasks = searchParams.get('autoCreate') !== 'false' // Default true

  if (!playerIdParam) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  const playerId = Number(playerIdParam)

  if (!Number.isFinite(playerId)) {
    return NextResponse.json({ error: 'Invalid playerId' }, { status: 400 })
  }

  try {
    // 1. Get existing coaching dashboard data
    let data = await getCoachingDashboardData(playerId)

    // 2. If auto-create is enabled and no active tasks, create from profiling
    if (autoCreateTasks && data.activeTasksCount === 0) {
      try {
        // Get player profile to extract improvement pillars
        const supabase = createServerClient(cookies())

        // Fetch matches for profile calculation
        const { data: digestData } = await supabase
          .from('matches_digest')
          .select(
            'match_id, kills, deaths, assists, duration_seconds, start_time, result, gold_per_min, xp_per_min, last_hits, denies',
          )
          .eq('player_account_id', playerId)
          .order('start_time', { ascending: false })
          .limit(20)

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
          const matches = await getRecentMatches(playerId, 20)
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

        if (matchesBase.length > 0) {
          // Get analysis data
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

          // Build MatchWithAnalysis array
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

          // Calculate profile pillars
          const performanceProfile =
            calculatePlayerPerformanceProfile(matchesWithAnalysis)
          const fightProfile = fromMatchesToFightProfile(matchesWithAnalysis)
          const pillars = computePillars(performanceProfile, fightProfile)

          // Get improvement pillars
          const improvementPillars = getImprovementPillars(pillars)

          // Create tasks from profiling
          if (improvementPillars.length > 0) {
            await createTasksFromProfiling(
              playerId,
              improvementPillars.map((p) => ({
                pillarId: p.pillarId,
                severity: p.severity,
              })),
            )

            // Reload dashboard data after creating tasks
            data = await getCoachingDashboardData(playerId)
          }
        }
      } catch (error: any) {
        console.error(
          '[API/COACHING/DASHBOARD] Error auto-creating tasks:',
          error,
        )
        // Continue with existing data even if auto-create fails
      }
    }

    // 3. Get coaching impact summary
    const impactSummary = await getCoachingImpactSummary(playerId, 30)

    // Update impact data with summary
    data.impact = {
      ...data.impact,
      matchesConsidered: 0, // TODO: Calculate from matches
      tasksCompleted: impactSummary.completedTasks,
      summaryText:
        impactSummary.completedTasks > 0
          ? `Negli ultimi 30 giorni hai completato ${
              impactSummary.completedTasks
            } task. ${
              impactSummary.completionTrend[3] > 0
                ? 'Trend positivo: continua così!'
                : 'Mantieni il ritmo per vedere miglioramenti concreti.'
            }`
          : "L'impatto del coaching verrà calcolato non appena completerai i primi task.",
    }

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('[API/COACHING/DASHBOARD] Error:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch coaching dashboard data' },
      { status: 500 },
    )
  }
}
