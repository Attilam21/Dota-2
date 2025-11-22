/**
 * API Route: Single Match Lane & Early Game Analysis
 * GET /api/dota/match-advanced/lane?matchId={id}&playerId={id}
 *
 * Returns lane analysis for a SINGLE match (not aggregated profile)
 */

import { NextResponse } from 'next/server'
import { getMatchLaneAnalysis } from '@/lib/dota/advancedAnalysis/matchLaneAnalysis'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchIdParam = searchParams.get('matchId')
  const playerIdParam = searchParams.get('playerId')

  if (!matchIdParam || !playerIdParam) {
    return NextResponse.json(
      { error: 'Missing matchId or playerId parameter' },
      { status: 400 },
    )
  }

  const matchId = Number(matchIdParam)
  const playerId = Number(playerIdParam)

  if (!Number.isFinite(matchId) || !Number.isFinite(playerId)) {
    return NextResponse.json(
      { error: 'Invalid matchId or playerId' },
      { status: 400 },
    )
  }

  try {
    const analysis = await getMatchLaneAnalysis(matchId, playerId)
    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not available for this match' },
        { status: 404 },
      )
    }
    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('[API/MATCH-ADVANCED/LANE] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch match lane analysis' },
      { status: 500 },
    )
  }
}
