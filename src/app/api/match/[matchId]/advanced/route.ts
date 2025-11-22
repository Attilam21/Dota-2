/**
 * API Route: Advanced Match Analysis
 *
 * GET /api/match/[matchId]/advanced?playerId={id}
 *
 * Returns complete advanced match analysis using Tier 1 data only
 */

import { NextResponse } from 'next/server'
import { getMatchDetail } from '@/services/dota/opendotaAdapter'
import { computeOverview } from '@/lib/dota/analysis/computeOverview'
import { computeLaningEfficiency } from '@/lib/dota/analysis/computeLaning'
import { computeCombat } from '@/lib/dota/analysis/computeCombat'
import { computeFarmScaling } from '@/lib/dota/analysis/computeFarmScaling'
import { computeItemProgression } from '@/lib/dota/analysis/computeItemProgression'
import { computeObjectives } from '@/lib/dota/analysis/computeObjectives'
import { computeTeamfights } from '@/lib/dota/analysis/computeTeamfights'
import { computeCriticalErrors } from '@/lib/dota/analysis/computeCriticalErrors'
import { getAdvancedAnalysis } from '@/lib/dota/matchAnalysis/getAdvancedAnalysis'

export async function GET(
  req: Request,
  { params }: { params: { matchId: string } },
) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')
  const matchId = Number(params.matchId)

  if (!playerIdParam) {
    return NextResponse.json(
      { error: 'Missing playerId parameter' },
      { status: 400 },
    )
  }

  const playerId = Number(playerIdParam)

  if (!Number.isFinite(matchId) || !Number.isFinite(playerId)) {
    return NextResponse.json(
      { error: 'Invalid matchId or playerId' },
      { status: 400 },
    )
  }

  try {
    // 1. Fetch match detail
    const matchDetail = await getMatchDetail(matchId, playerId)

    // 2. Fetch advanced analysis (kill distribution, role)
    const advancedAnalysis = await getAdvancedAnalysis(matchId, playerId)

    // 3. Compute all analysis blocks
    const overview = computeOverview(matchDetail)
    const laning = await computeLaningEfficiency(matchDetail)
    const combat = computeCombat(matchDetail)
    const farmScaling = computeFarmScaling(matchDetail)
    const itemProgression = computeItemProgression(matchDetail)
    const objectives = computeObjectives(matchDetail)
    const teamfights = computeTeamfights(matchDetail)
    const criticalErrors = computeCriticalErrors(matchDetail)

    // 4. Build response with match header info
    const response = {
      match: {
        matchId: matchDetail.match.matchId,
        durationSeconds: matchDetail.match.durationSeconds,
        startTime: matchDetail.match.startTime,
        radiantWin: matchDetail.match.radiantWin,
      },
      player: {
        accountId: playerId,
        heroId: matchDetail.player.heroId,
        role: advancedAnalysis?.rolePosition || null,
      },
      overview,
      laning,
      combat,
      farmScaling,
      itemProgression,
      objectives,
      teamfights,
      criticalErrors,
    }

    return NextResponse.json(response)
  } catch (e: any) {
    console.error('[API/MATCH/ADVANCED] Error:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch advanced match analysis' },
      { status: 500 },
    )
  }
}
