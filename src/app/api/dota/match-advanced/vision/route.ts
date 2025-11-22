/**
 * API Route: Single Match Vision & Map Control Analysis
 * GET /api/dota/match-advanced/vision?matchId={id}&playerId={id}
 *
 * Returns vision analysis for a SINGLE match (not aggregated profile)
 */

import { NextResponse } from 'next/server'
import { getMatchVisionAnalysis } from '@/lib/dota/advancedAnalysis/matchVisionAnalysis'

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
    const analysis = await getMatchVisionAnalysis(matchId, playerId)
    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not available for this match' },
        { status: 404 },
      )
    }
    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('[API/MATCH-ADVANCED/VISION] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch match vision analysis' },
      { status: 500 },
    )
  }
}
